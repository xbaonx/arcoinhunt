import 'dart:math';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class UserIdService {
  static const _key = 'user_id';
  final FlutterSecureStorage storage;
  UserIdService(this.storage);

  Future<String> getOrCreate() async {
    final existing = await storage.read(key: _key);
    if (existing != null && existing.isNotEmpty) return existing;
    final rnd = Random();
    final id = 'user-${DateTime.now().millisecondsSinceEpoch}-${rnd.nextInt(1 << 32)}';
    await storage.write(key: _key, value: id);
    return id;
  }
}
