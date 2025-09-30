import 'package:flutter/material.dart';

class Shimmer extends StatefulWidget {
  final double height;
  final double width;
  const Shimmer({super.key, required this.height, required this.width});

  @override
  State<Shimmer> createState() => _ShimmerState();
}

class _ShimmerState extends State<Shimmer> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat();
  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (_, __) {
        return Container(
          height: widget.height,
          width: widget.width,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            gradient: LinearGradient(
              colors: [Colors.grey.shade800, Colors.grey.shade700, Colors.grey.shade800],
              stops: [(_c.value - 0.2).clamp(0, 1), _c.value, (_c.value + 0.2).clamp(0, 1)],
            ),
          ),
        );
      },
    );
  }
}
