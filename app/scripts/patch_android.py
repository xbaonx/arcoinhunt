#!/usr/bin/env python3
import os
import re
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'android' / 'app' / 'src' / 'main' / 'AndroidManifest.xml'
GRADLE_GROOVY = ROOT / 'android' / 'app' / 'build.gradle'
GRADLE_KTS = ROOT / 'android' / 'app' / 'build.gradle.kts'

NS = {'android': 'http://schemas.android.com/apk/res/android'}
ET.register_namespace('android', NS['android'])

PERMS = [
    'android.permission.INTERNET',
    'android.permission.CAMERA',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
]

FEATURES = [
    ('android.hardware.camera.ar', False),
]


def backup(p: Path):
    if p.exists():
        bak = p.with_suffix(p.suffix + f'.bak_{int(time.time())}')
        bak.write_bytes(p.read_bytes())
        print(f'[backup] {p} -> {bak}')


def patch_manifest():
    if not MANIFEST.exists():
        print(f'[error] AndroidManifest not found at {MANIFEST}', file=sys.stderr)
        return 1
    backup(MANIFEST)

    tree = ET.parse(MANIFEST)
    root = tree.getroot()

    # Ensure permissions
    existing_perms = set(
        p.get(f'{{{NS["android"]}}}name') for p in root.findall('uses-permission')
        if p.get(f'{{{NS["android"]}}}name')
    )
    for perm in PERMS:
        if perm not in existing_perms:
            ET.SubElement(root, 'uses-permission', {f'{{{NS["android"]}}}name': perm})
            print(f'[manifest] add uses-permission {perm}')

    # Ensure AR feature
    existing_features = {(f.get(f'{{{NS["android"]}}}name'), f.get(f'{{{NS["android"]}}}required'))
                         for f in root.findall('uses-feature')}
    for name, required in FEATURES:
        key = (name, 'true' if required else 'false')
        if key not in existing_features:
            ET.SubElement(root, 'uses-feature', {
                f'{{{NS["android"]}}}name': name,
                f'{{{NS["android"]}}}required': 'true' if required else 'false',
            })
            print(f'[manifest] add uses-feature {name} required={required}')

    app = root.find('application')
    if app is None:
        app = ET.SubElement(root, 'application')
        print('[manifest] created <application>')

    # Enable cleartext traffic (dev)
    if app.get(f'{{{NS["android"]}}}usesCleartextTraffic') != 'true':
        app.set(f'{{{NS["android"]}}}usesCleartextTraffic', 'true')
        print('[manifest] set usesCleartextTraffic=true (dev only)')

    # Add ARCore optional meta-data
    md_found = False
    for md in app.findall('meta-data'):
        if md.get(f'{{{NS["android"]}}}name') == 'com.google.ar.core':
            md_found = True
            break
    if not md_found:
        ET.SubElement(app, 'meta-data', {
            f'{{{NS["android"]}}}name': 'com.google.ar.core',
            f'{{{NS["android"]}}}value': 'optional',
        })
        print('[manifest] add meta-data com.google.ar.core=optional')

    tree.write(MANIFEST, encoding='utf-8', xml_declaration=True)
    print('[ok] AndroidManifest.xml patched')
    return 0


def patch_gradle(path: Path):
    if not path.exists():
        return False
    backup(path)
    txt = path.read_text(encoding='utf-8')

    # Replace compileSdkVersion/minSdkVersion/targetSdkVersion with numeric values
    def rep(pattern, repl):
        nonlocal txt
        new_txt, n = re.subn(pattern, repl, txt, flags=re.MULTILINE)
        if n:
            print(f'[gradle] {path.name}: replaced {n} occurrence(s) of pattern: {pattern}')
        txt = new_txt

    rep(r"compileSdkVersion\s+[^\n\r]+", "compileSdkVersion 34")
    rep(r"minSdkVersion\s+[^\n\r]+", "minSdkVersion 24")
    rep(r"targetSdkVersion\s+[^\n\r]+", "targetSdkVersion 34")

    path.write_text(txt, encoding='utf-8')
    print(f'[ok] {path.name} patched')
    return True


def main():
    # Ensure android project exists
    if not (ROOT / 'android').exists():
        print('[error] Android project missing. Run: flutter create . in app/', file=sys.stderr)
        return 1

    rc = patch_manifest()
    if rc != 0:
        return rc

    if not (patch_gradle(GRADLE_GROOVY) or patch_gradle(GRADLE_KTS)):
        print('[warn] build.gradle not found; skip SDK patch')

    print('\nNext steps:')
    print('  1) In Android Studio, File > Sync Project with Gradle Files')
    print('  2) If using emulator, run with --dart-define=API_BASE_URL=http://10.0.2.2:8080')
    print('  3) On device, run: adb reverse tcp:8080 tcp:8080 then use http://localhost:8080')
    return 0

if __name__ == '__main__':
    sys.exit(main())
