import 'dart:io';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/network/api_client.dart';

sealed class ARCaptureState {}
class ARInitial extends ARCaptureState {}
class ARCapturing extends ARCaptureState {}
class ARCaptured extends ARCaptureState {
  final Map<String, dynamic> payload;
  ARCaptured(this.payload);
}
class ARError extends ARCaptureState {
  final String message;
  ARError(this.message);
}

class ARCaptureCubit extends Cubit<ARCaptureState> {
  final ApiClient api;
  ARCaptureCubit(this.api) : super(ARInitial());

  Future<void> capture({required File image, required String userId, required double lat, required double lng, required String locationId}) async {
    emit(ARCapturing());
    try {
      final res = await api.capture(image: image, userId: userId, lat: lat, lng: lng, locationId: locationId);
      emit(ARCaptured(res));
    } catch (e) {
      emit(ARError('$e'));
    }
  }
}
