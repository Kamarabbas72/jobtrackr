import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Dimensions
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STATUS_LABELS, STATUS_COLORS, Job, JobStatus, loadJobs } from './index';

const { width } = Dimensions.get('window');

function StatBig({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <View style={[styles.statBig, { borderLeftColor: color }]}>
      <Text style={[styles.statBigValue, { color }]}>{value}</Text>
      <Text style={styles.statBigLabel}>{label}</Text>
    </View>
  );
}

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={styles.barChart}>
      {data.map((item, i) => (
        <View key={i} style={styles.barItem}>
          <Text style={styles.barValue}>{item.value}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, {
              width: `${(item.value / max) * 100}%`,
              backgroundColor: item.color,
              minWidth: item.value > 0 ? 4 : 0,
            }]} />
          </View>
          <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function PipelineFunnel({ jobs }: { jobs: Job[] }) {
  const statuses: JobStatus[] = ['applied', 'phone_screen', 'interview', 'offer'];
  const total = jobs.length || 1;
  return (
    <View style={styles.funnel}>
      {statuses.map((status, i) => {
        const count = jobs.filter(j => j.status === status).length;
        const pct = Math.round((count / total) * 100);
        const barWidth = 100 - (i * 12);
        return (
          <View key={status} style={styles.funnelRow}>
            <Text style={styles.funnelLabel}>{STATUS_LABELS[status]}</Text>
            <View style={styles.funnelTrack}>
              <View style={[styles.funnelFill, {
                width: `${barWidth}%`,
                backgroundColor: STATUS_COLORS[status],
                opacity: count > 0 ? 1 : 0.2,
              }]}>
                <Text style={styles.funnelCount}>{count}</Text>
              </View>
            </View>
            <Text style={styles.funnelPct}>{pct}%</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function Statistics() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);

  useFocusEffect(useCallback(() => {
    loadJobs().then(setJobs);
  }, []));

  const total = jobs.length;
  const offers = jobs.filter(j => j.status === 'offer').length;
  const interviews = jobs.filter(j => j.status === 'interview').length;
  const rejected = jobs.filter(j => j.status === 'rejected').length;
  const successRate = total > 0 ? Math.round((offers / total) * 100) : 0;
  const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0;

  // By country
  const countries = [...new Set(jobs.map(j => j.country))];
  const countryData = countries.map(c => ({
    label: c,
    value: jobs.filter(j => j.country === c).length,
    color: COLORS.primary,
  })).sort((a, b) => b.value - a.value).slice(0, 6);

  // By source
  const sources = [...new Set(jobs.map(j => j.source))];
  const sourceData = sources.map(s => ({
    label: s,
    value: jobs.filter(j => j.source === s).length,
    color: COLORS.applied,
  })).sort((a, b) => b.value - a.value);

  // By status
  const statusData = (Object.keys(STATUS_LABELS) as JobStatus[]).map(s => ({
    label: STATUS_LABELS[s],
    value: jobs.filter(j => j.status === s).length,
    color: STATUS_COLORS[s],
  })).filter(d => d.value > 0);

  // Weekly activity (last 4 weeks)
  const weeklyData = Array.from({ length: 4 }, (_, i) => {
    const start = new Date();
    start.setDate(start.getDate() - (i + 1) * 7);
    const end = new Date();
    end.setDate(end.getDate() - i * 7);
    const count = jobs.filter(j => {
      const d = new Date(j.dateApplied);
      return d >= start && d < end;
    }).length;
    return {
      label: `W-${i + 1}`,
      value: count,
      color: COLORS.primary,
    };
  }).reverse();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistics</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Key Metrics */}
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <StatBig value={total} label="Total Applications" color={COLORS.primary} />
          <StatBig value={`${successRate}%`} label="Offer Rate" color={COLORS.offer} />
          <StatBig value={`${interviewRate}%`} label="Interview Rate" color={COLORS.interview} />
          <StatBig value={rejected} label="Rejected" color={COLORS.rejected} />
        </View>

        {/* Pipeline Funnel */}
        <Text style={styles.sectionTitle}>Conversion Funnel</Text>
        <View style={styles.card}>
          {total === 0 ? (
            <Text style={styles.emptyText}>No data yet — add applications to see your funnel</Text>
          ) : (
            <PipelineFunnel jobs={jobs} />
          )}
        </View>

        {/* Weekly Activity */}
        <Text style={styles.sectionTitle}>Weekly Activity</Text>
        <View style={styles.card}>
          {total === 0 ? (
            <Text style={styles.emptyText}>No applications yet</Text>
          ) : (
            <BarChart data={weeklyData} />
          )}
        </View>

        {/* By Country */}
        <Text style={styles.sectionTitle}>By Country</Text>
        <View style={styles.card}>
          {countryData.length === 0 ? (
            <Text style={styles.emptyText}>No data yet</Text>
          ) : (
            <BarChart data={countryData} />
          )}
        </View>

        {/* By Source */}
        <Text style={styles.sectionTitle}>By Source</Text>
        <View style={styles.card}>
          {sourceData.length === 0 ? (
            <Text style={styles.emptyText}>No data yet</Text>
          ) : (
            <BarChart data={sourceData} />
          )}
        </View>

        {/* By Status */}
        <Text style={styles.sectionTitle}>By Status</Text>
        <View style={styles.card}>
          {statusData.length === 0 ? (
            <Text style={styles.emptyText}>No data yet</Text>
          ) : (
            <BarChart data={statusData} />
          )}
        </View>

        {/* Tips */}
        {total > 0 && (
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Insights</Text>
            {interviewRate < 10 && total > 5 && (
              <Text style={styles.tipText}>• Your interview rate is low. Try tailoring your CV more specifically to each job description.</Text>
            )}
            {interviewRate >= 10 && interviewRate < 30 && (
              <Text style={styles.tipText}>• Good interview rate! Focus on converting interviews to offers.</Text>
            )}
            {offers > 0 && (
              <Text style={styles.tipText}>• 🎉 You have {offers} offer{offers > 1 ? 's' : ''}! Great work!</Text>
            )}
            {total < 5 && (
              <Text style={styles.tipText}>• Apply to more positions to get better statistics. Aim for 5+ applications per week.</Text>
            )}
            {sourceData.length > 0 && (
              <Text style={styles.tipText}>• Your best source is {sourceData[0].label} with {sourceData[0].value} applications.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: COLORS.text },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBig: { width: (width - 42) / 2, backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statBigValue: { fontSize: 28, fontWeight: '700' },
  statBigLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  barChart: { gap: 12 },
  barItem: { gap: 4 },
  barValue: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  barTrack: { height: 28, backgroundColor: COLORS.background, borderRadius: 6, overflow: 'hidden', justifyContent: 'center' },
  barFill: { height: '100%', borderRadius: 6, justifyContent: 'center', paddingLeft: 8 },
  barLabel: { fontSize: 12, color: COLORS.textMuted },
  funnel: { gap: 10 },
  funnelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  funnelLabel: { width: 90, fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  funnelTrack: { flex: 1, height: 32, backgroundColor: COLORS.background, borderRadius: 6, overflow: 'hidden', justifyContent: 'center' },
  funnelFill: { height: '100%', borderRadius: 6, justifyContent: 'center', paddingLeft: 8 },
  funnelCount: { color: 'white', fontSize: 12, fontWeight: '700' },
  funnelPct: { width: 36, fontSize: 12, color: COLORS.textMuted, textAlign: 'right' },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', fontSize: 14, paddingVertical: 16 },
  tipsCard: { backgroundColor: COLORS.primaryLight, borderRadius: 14, padding: 16, marginTop: 8 },
  tipsTitle: { fontSize: 15, fontWeight: '700', color: COLORS.primaryDark, marginBottom: 10 },
  tipText: { fontSize: 13, color: COLORS.primaryDark, lineHeight: 20, marginBottom: 6 },
});
