import 'dart:io';
import 'dart:ui' as ui;
import 'package:ar_flutter_plugin/ar_flutter_plugin.dart';
import 'package:ar_flutter_plugin/managers/ar_object_manager.dart';
import 'package:ar_flutter_plugin/managers/ar_session_manager.dart';
import 'package:ar_flutter_plugin/managers/ar_anchor_manager.dart';
import 'package:ar_flutter_plugin/managers/ar_location_manager.dart';
import 'package:ar_flutter_plugin/models/ar_node.dart';
import 'package:ar_flutter_plugin/datatypes/node_types.dart';
import 'package:vector_math/vector_math_64.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';
import 'package:path_provider/path_provider.dart';
import '../../../core/network/api_client.dart';
import '../bloc/ar_capture_cubit.dart';
import 'package:flutter/rendering.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../auth/user_id_service.dart';

class ARCapturePage extends StatefulWidget {
  final String? locationId;
  final double? lat;
  final double? lng;
  const ARCapturePage({super.key, this.locationId, this.lat, this.lng});

  @override
  State<ARCapturePage> createState() => _ARCapturePageState();
}

class _ARCapturePageState extends State<ARCapturePage> {
  final repaintKey = GlobalKey();
  ARSessionManager? sessionManager;
  ARObjectManager? objectManager;

  String? userId;
  String? get locationId => widget.locationId;
  double? get lat => widget.lat;
  double? get lng => widget.lng;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => ARCaptureCubit(GetIt.I<ApiClient>()),
      child: Scaffold(
        body: Stack(
          children: [
            RepaintBoundary(
              key: repaintKey,
              child: ARView(
                onARViewCreated: (
                  ARSessionManager arSessionManager,
                  ARObjectManager arObjectManager,
                  ARAnchorManager arAnchorManager,
                  ARLocationManager arLocationManager,
                ) async {
                  sessionManager = arSessionManager;
                  objectManager = arObjectManager;
                  await sessionManager?.onInitialize(
                    showFeaturePoints: false,
                    showPlanes: true,
                    showWorldOrigin: false,
                  );
                  await objectManager?.onInitialize();
                  // ensure we have a user id
                  userId ??= await GetIt.I<UserIdService>().getOrCreate();
                  try {
                    final node = ARNode(
                      // Use a web-hosted GLB to ensure compatibility on all platforms
                      type: NodeType.webGLB,
                      uri: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Duck/glTF-Binary/Duck.glb',
                      scale: Vector3(0.2, 0.2, 0.2),
                      position: Vector3(0, 0, -1.0),
                    );
                    await objectManager?.addNode(node);
                  } catch (e) {
                    // Fallback: nếu asset trống/thiếu, thử tải GLB mẫu qua mạng để test nhanh
                    try {
                      final webNode = ARNode(
                        type: NodeType.webGLB,
                        uri: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Duck/glTF-Binary/Duck.glb',
                        scale: Vector3(0.2, 0.2, 0.2),
                        position: Vector3(0, 0, -1.0),
                      );
                      await objectManager?.addNode(webNode);
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Đã tải mô hình mẫu (Duck.glb) tạm thời.')),
                        );
                      }
                    } catch (_) {
                      // Bỏ qua nếu fallback cũng thất bại
                    }
                  }
                },
              ),
            ),
            Positioned(
              bottom: 24,
              left: 0,
              right: 0,
              child: Center(
                child: BlocConsumer<ARCaptureCubit, ARCaptureState>(
                  listener: (context, state) {
                    if (state is ARError) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.message)));
                    }
                    if (state is ARCaptured) {
                      showModalBottomSheet(context: context, builder: (_) => _ResultSheet(payload: state.payload));
                    }
                  },
                  builder: (context, state) {
                    final loading = state is ARCapturing;
                    final enabled = locationId != null && lat != null && lng != null;
                    return ElevatedButton.icon(
                      onPressed: (!enabled || loading) ? null : () async {
                        final img = await _captureImage();
                        if (img == null) return;
                        // TODO: Replace with real user/location
                        final uid = userId ?? await GetIt.I<UserIdService>().getOrCreate();
                        await context.read<ARCaptureCubit>().capture(image: img, userId: uid, lat: lat!, lng: lng!, locationId: locationId!);
                      },
                      icon: const Icon(Icons.camera_alt),
                      label: Text(!enabled ? 'Open from Map near a location' : (loading ? 'Capturing...' : 'Capture')),
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16), shape: const StadiumBorder()),
                    );
                  },
                ),
              ),
            )
          ],
        ),
      ),
    );
  }

  Future<File?> _captureImage() async {
    try {
      final boundary = repaintKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return null;
      final ui.Image image = await boundary.toImage(pixelRatio: 2.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) return null;
      final bytes = byteData.buffer.asUint8List();
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/ar_capture_${DateTime.now().millisecondsSinceEpoch}.png');
      await file.writeAsBytes(bytes);
      return file;
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Capture failed: $e')));
      }
      return null;
    }
  }
}

class _ResultSheet extends StatelessWidget {
  final Map<String, dynamic> payload;
  const _ResultSheet({required this.payload});

  @override
  Widget build(BuildContext context) {
    final tokenId = payload['tokenId'];
    final openseaUrl = payload['openseaUrl'];
    final preview = payload['previewImage'];
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Minted to admin', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text('Token #$tokenId'),
          const SizedBox(height: 8),
          if (preview != null) Image.network(preview, height: 160, fit: BoxFit.cover),
          const SizedBox(height: 12),
          Row(
            children: [
              TextButton.icon(onPressed: () => _open(openseaUrl), icon: const Icon(Icons.open_in_new), label: const Text('OpenSea')),
              const Spacer(),
              ElevatedButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Close')),
            ],
          )
        ],
      ),
    );
  }

  void _open(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
