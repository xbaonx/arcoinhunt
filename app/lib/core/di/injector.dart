import 'dart:io' show Platform;
import 'package:dio/dio.dart';
import 'package:get_it/get_it.dart';
import '../config/app_config.dart';
import '../network/api_client.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../features/auth/user_id_service.dart';

final sl = GetIt.instance;

Future<void> setupInjector() async {
  // Rewrite localhost for Android emulator to 10.0.2.2
  final rawBase = AppConfig.apiBaseUrl;
  final parsed = Uri.tryParse(rawBase);
  final useLoopbackFix = Platform.isAndroid && parsed != null &&
      (parsed.host == 'localhost' || parsed.host == '127.0.0.1');
  final fixedBaseUrl = (useLoopbackFix && parsed != null)
      ? parsed.replace(host: '10.0.2.2').toString()
      : rawBase;

  final dio = Dio(BaseOptions(
    baseUrl: fixedBaseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 20),
    sendTimeout: const Duration(seconds: 20),
    headers: {
      'Accept': 'application/json',
    },
  ));
  sl.registerSingleton<Dio>(dio);
  sl.registerLazySingleton<ApiClient>(() => ApiClient(sl()));
  sl.registerLazySingleton<FlutterSecureStorage>(() => const FlutterSecureStorage());
  sl.registerLazySingleton<UserIdService>(() => UserIdService(sl()));
}
