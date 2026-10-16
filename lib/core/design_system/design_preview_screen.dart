import 'package:flutter/material.dart';
import 'package:team_easy/core/design_system/scenario_switcher.dart';
import 'package:team_easy/core/design_system/te_context.dart';
import 'package:team_easy/core/design_system/tokens/te_metrics.dart';
import 'package:team_easy/core/design_system/widgets/te_logo.dart';
import 'package:team_easy/core/design_system/widgets/te_message_bubble.dart';

/// Living style guide: every token and component in one scroll.
/// Debug tool for design review, not a product screen.
class DesignPreviewScreen extends StatelessWidget {
  const DesignPreviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final te = context.te;
    final t = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Team Easy'),
        leadingWidth: TeSize.avatarMd + TeSpace.sm,
        leading: const Padding(
          padding: EdgeInsets.all(TeSpace.sm),
          child: TeLogo(size: 32),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(TeSpace.gutter),
        children: [
          const _Section('Brand'),
          Row(
            children: [
              const TeLogo(size: 72, semanticLabel: 'Team Easy'),
              const SizedBox(width: TeSpace.lg),
              Expanded(
                child: Text('Teams talk. Work moves.', style: t.headlineMedium),
              ),
            ],
          ),
          const _Section('Color'),
          Wrap(
            spacing: TeSpace.sm,
            runSpacing: TeSpace.sm,
            children: [
              _Swatch('brand', te.brand),
              _Swatch('action', te.action),
              _Swatch('accent', te.accent),
              _Swatch('accentSoft', te.accentSoft),
              _Swatch('highlight', te.highlight),
              _Swatch('background', te.background),
              _Swatch('surfaceTinted', te.surfaceTinted),
              _Swatch('surfaceSunken', te.surfaceSunken),
              _Swatch('textPrimary', te.textPrimary),
              _Swatch('textSecondary', te.textSecondary),
              _Swatch('border', te.border),
              _Swatch('success', te.success),
              _Swatch('warning', te.warning),
              _Swatch('error', te.error),
              _Swatch('info', te.info),
            ],
          ),
          const _Section('Type'),
          Text('Display 32', style: t.displayMedium),
          Text('Headline 22', style: t.headlineMedium),
          Text('Title 18', style: t.titleLarge),
          Text('Title 16', style: t.titleMedium),
          Text(
            'Body 16. Long names and messages wrap cleanly.',
            style: t.bodyLarge,
          ),
          Text('Body 14 for dense lists', style: t.bodyMedium),
          Text('Label 14', style: t.labelLarge),
          Text('Caption 12', style: t.bodySmall),
          const _Section('Buttons'),
          Wrap(
            spacing: TeSpace.sm,
            runSpacing: TeSpace.sm,
            children: [
              FilledButton(onPressed: () {}, child: const Text('Primary')),
              OutlinedButton(onPressed: () {}, child: const Text('Secondary')),
              TextButton(onPressed: () {}, child: const Text('Tertiary')),
              FilledButton(
                style: FilledButton.styleFrom(backgroundColor: te.error),
                onPressed: () {},
                child: const Text('Delete group'),
              ),
              const FilledButton(onPressed: null, child: Text('Disabled')),
            ],
          ),
          const _Section('Fields'),
          const TextField(
            decoration: InputDecoration(
              labelText: 'Search members',
              prefixIcon: Icon(Icons.search),
            ),
          ),
          const SizedBox(height: TeSpace.md),
          const TextField(
            decoration: InputDecoration(
              labelText: 'Email',
              errorText: 'Enter a valid email address',
            ),
          ),
          const _Section('Chips and badges'),
          Wrap(
            spacing: TeSpace.sm,
            runSpacing: TeSpace.sm,
            children: [
              const Chip(label: Text('Design lead')),
              ChoiceChip(
                label: const Text('Unread'),
                selected: true,
                onSelected: (_) {},
              ),
              ChoiceChip(
                label: const Text('Groups'),
                selected: false,
                onSelected: (_) {},
              ),
              const Badge(label: Text('128'), child: Icon(Icons.chat_bubble)),
            ],
          ),
          const _Section('List'),
          const Card(
            child: Column(
              children: [
                ListTile(
                  leading: CircleAvatar(child: Text('AK')),
                  title: Text('Amelia Kowalczyk-Fernandez'),
                  subtitle: Text('Shared the Q4 launch checklist'),
                  trailing: Badge(label: Text('3')),
                ),
                Divider(),
                ListTile(
                  leading: CircleAvatar(child: Text('PM')),
                  title: Text('Product Team'),
                  subtitle: Text('Omar: Ready when you are 👍'),
                ),
              ],
            ),
          ),
          const _Section('Messages'),
          const TeMessageBubble(
            text: 'Can you send the latest build?',
            time: '09:41',
            senderName: 'Omar',
          ),
          const SizedBox(height: TeSpace.md),
          const TeMessageBubble(
            text: 'Pushing it now.',
            time: '09:42',
            isSent: true,
          ),
          const SizedBox(height: TeSpace.md),
          const TeMessageBubble(
            text: 'Uploading the screenshots…',
            time: '09:43',
            isSent: true,
            status: TeBubbleStatus.sending,
          ),
          const SizedBox(height: TeSpace.md),
          const TeMessageBubble(
            text: 'This one did not go through.',
            time: '09:44',
            isSent: true,
            status: TeBubbleStatus.failed,
          ),
          const _Section('Announcement'),
          DecoratedBox(
            decoration: BoxDecoration(
              color: te.highlight,
              borderRadius: TeRadius.lgAll,
            ),
            child: Padding(
              padding: const EdgeInsets.all(TeSpace.lg),
              child: Text(
                'Office closed Friday for the company offsite.',
                style: t.bodyLarge,
              ),
            ),
          ),
          const _Section('Mock scenario (debug)'),
          const ScenarioSwitcher(),
          const SizedBox(height: TeSpace.huge),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section(this.title);

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: TeSpace.xxxl, bottom: TeSpace.md),
      child: Text(
        title.toUpperCase(),
        style: Theme.of(context).textTheme.labelMedium
            ?.copyWith(color: context.te.textSecondary, letterSpacing: 1),
      ),
    );
  }
}

class _Swatch extends StatelessWidget {
  const _Swatch(this.name, this.color);

  final String name;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 104,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DecoratedBox(
            decoration: BoxDecoration(
              color: color,
              borderRadius: TeRadius.mdAll,
              border: Border.all(color: context.te.border),
            ),
            child: const SizedBox(height: 56, width: 104),
          ),
          const SizedBox(height: TeSpace.xs),
          Text(name, style: Theme.of(context).textTheme.labelMedium),
        ],
      ),
    );
  }
}
