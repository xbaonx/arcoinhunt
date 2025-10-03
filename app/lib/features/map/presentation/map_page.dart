import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import '../../../core/network/api_client.dart';
import '../../auth/user_id_service.dart';
import 'package:geolocator/geolocator.dart';
import '../../ar/presentation/ar_capture_page.dart';

class MapPage extends StatefulWidget {
  const MapPage({super.key});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> {
  final api = GetIt.I<ApiClient>();
  List<dynamic> items = [];
  bool loading = false;
  String? error;
  String? userId;
  Position? current;
  final radius = 1000.0; // meters (larger for testing)

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      userId = await GetIt.I<UserIdService>().getOrCreate();
      await _ensurePermission();
      current = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      await _load();
    } catch (e) {
      setState(() {
        error = '$e';
      });
    }
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final lat = current?.latitude ?? 10.7798;
      final lng = current?.longitude ?? 106.6990;
      final res = await api.nearby(lat: lat, lng: lng, userId: userId ?? '', radius: radius.toInt());
      setState(() => items = res);
    } catch (e) {
      setState(() {
        error = '$e';
        items = [];
      });
    } finally {
      setState(() => loading = false);
    }
  Future<void> _ensurePermission() async {
    LocationPermission perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    if (perm == LocationPermission.deniedForever || perm == LocationPermission.denied) {
      throw Exception('Location permission denied');
    }
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw Exception('Location services disabled');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nearby Coins'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: loading ? null : _load,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : (error != null)
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          error!,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        FilledButton(onPressed: _load, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : (items.isEmpty)
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('No locations within ~${radius.toStringAsFixed(0)}m.'),
                          const SizedBox(height: 8),
                          FilledButton(onPressed: _load, child: const Text('Refresh')),
                        ],
                      ),
                    )
                  : ListView.separated(
                      itemCount: items.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, i) {
                        final it = items[i] as Map<String, dynamic>;
                        final distance = (it["distance"] as num?)?.toDouble() ?? 99999;
                        final near = distance <= radius;
                        return ListTile(
                          title: Text(it['name']?.toString() ?? 'Unknown'),
                          subtitle: Text('~${distance.toStringAsFixed(0)}m'),
                          trailing: FilledButton(
                            onPressed: !near
                                ? null
                                : () async {
                                    final lat = (it['lat'] as num).toDouble();
                                    final lng = (it['lng'] as num).toDouble();
                                    final locationId = it['id'].toString();
                                    if (!context.mounted) return;
                                    Navigator.of(context).push(MaterialPageRoute(
                                      builder: (_) => ARCapturePage(locationId: locationId, lat: lat, lng: lng),
                                    ));
                                  },
                            child: const Text('Open AR'),
                          ),
                        );
                      },
                    ),
    );
  }
}
