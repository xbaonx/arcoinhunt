import 'package:flutter/material.dart';

class AppCard extends StatelessWidget {
  final Widget child;
  const AppCard({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withOpacity(0.7),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(blurRadius: 12, color: Colors.black.withOpacity(0.2))],
      ),
      padding: const EdgeInsets.all(16),
      child: child,
    );
  }
}
