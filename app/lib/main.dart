import 'package:flutter/material.dart';
import 'core/di/injector.dart';
import 'core/theme/app_theme.dart';
import 'features/ar/presentation/ar_capture_page.dart';
import 'features/map/presentation/map_page.dart';
import 'features/nft/presentation/nft_list_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await setupInjector();
  runApp(const ARCoinHuntApp());
}

class ARCoinHuntApp extends StatefulWidget {
  const ARCoinHuntApp({super.key});

  @override
  State<ARCoinHuntApp> createState() => _ARCoinHuntAppState();
}

class _ARCoinHuntAppState extends State<ARCoinHuntApp> {
  int _index = 1; // Default to AR tab

  final _pages = const [
    MapPage(),
    ARCapturePage(),
    NftListPage(),
  ];

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AR Coin Hunt',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      home: Scaffold(
        body: _pages[_index],
        bottomNavigationBar: NavigationBar(
          selectedIndex: _index,
          onDestinationSelected: (i) => setState(() => _index = i),
          destinations: const [
            NavigationDestination(icon: Icon(Icons.map_outlined), selectedIcon: Icon(Icons.map), label: 'Map'),
            NavigationDestination(icon: Icon(Icons.camera_outlined), selectedIcon: Icon(Icons.camera_alt), label: 'AR'),
            NavigationDestination(icon: Icon(Icons.wallet_outlined), selectedIcon: Icon(Icons.wallet), label: 'My NFTs'),
          ],
        ),
      ),
    );
  }
}
