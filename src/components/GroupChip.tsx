import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DistributionGroup } from '../types';

interface Props {
  group: DistributionGroup;
  memberCount?: number;
}

export default function GroupChip({ group, memberCount }: Props) {
  return (
    <View style={[styles.chip, { borderColor: group.color, backgroundColor: group.color + '18' }]}>
      <Text style={[styles.text, { color: group.color }]}>
        {group.name}
        {memberCount !== undefined ? ` (${memberCount})` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 4,
    marginBottom: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
