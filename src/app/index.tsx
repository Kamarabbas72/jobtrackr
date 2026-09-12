import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList, RefreshControl, Alert, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ── TYPES ──
export type JobStatus = 'wishlist' | 'applied' | 'phone_screen' | 'interview' | 'offer' | 'rejected';

export interface Job {
  id: string;
  company: string;
  role: string;
  location: string;
  country: string;
  salary?: string;
  jobUrl?: string;
  source: string;
  status: JobStatus;
  dateApplied: string;
  notes?: string;
  contactName?: string;
  contactEmail?: string;
  followUpDate?: string;
  createdAt: string;
}

// ── CONSTANTS ──
export const COLORS = {
  primary: '#16A34A',
  primaryLight: '#DCFCE7',
  primaryDark: '#15803D',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  wishlist: '#8B5CF6',
  applied: '#3B82F6',
  phone_screen: '#F59E0B',
  interview: '#EF4444',
  offer: '#16A34A',
  rejected: '#94A3B8',
};

export const STATUS_LABELS: Record<JobStatus, string> = {
  wishlist: 'Wishlist',
  applied: 'Applied',
  phone_screen: 'Phone Screen',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

export const STATUS_COLORS: Record<JobStatus, string> = {
  wishlist: COLORS.wishlist,
  applied: COLORS.applied,
  phone_screen: COLORS.phone_screen,
  interview: COLORS.interview,
  offer: COLORS.offer,
  rejected: COLORS.rejected,
};

const STORAGE_KEY = 'jobtrackr_jobs';

export async function loadJobs(): Promise<Job[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveJobs(jobs: Job[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

// ── COMPONENTS ──
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function JobCard({ job, onPress, onDelete }: { job: Job; onPress: () => void; onDelete: () => void }) {
  const statusColor = STATUS_COLORS[job.status];
  const daysAgo = Math.floor((Date.now() - new Date(job.dateApplied).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <TouchableOpacity style={styles.jobCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.jobCardAccent, { backgroundColor: statusColor }]} />
      <View style={styles.jobCardContent}>
        <View style={styles.jobCardHeader}>
          <View style={styles.jobCardTitles}>
            <Text style={styles.jobCompany} numberOfLines={1}>{job.company}</Text>
            <Text style={styles.jobRole} numberOfLines={1}>{job.role}</Text>
          </View>
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={styles.jobCardFooter}>
          <View style={styles.jobCardMeta}>
            <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.jobMetaText}>{job.location}, {job.country}</Text>
          </View>
          <View style={styles.jobCardMeta}>
            <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.jobMetaText}>{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[job.status]}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── MAIN SCREEN ──
export default function Dashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeFilter, setActiveFilter] = useState<JobStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    const data = await loadJobs();
    setJobs(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);

  useFocusEffect(useCallback(() => { fetchJobs(); }, [fetchJobs]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const deleteJob = (id: string) => {
    Alert.alert('Delete Application', 'Are you sure you want to delete this application?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const updated = jobs.filter(j => j.id !== id);
          await saveJobs(updated);
          setJobs(updated);
        }
      }
    ]);
  };

  const filteredJobs = activeFilter === 'all' ? jobs : jobs.filter(j => j.status === activeFilter);

  const stats = {
    total: jobs.length,
    applied: jobs.filter(j => j.status === 'applied').length,
    interview: jobs.filter(j => j.status === 'interview').length,
    offer: jobs.filter(j => j.status === 'offer').length,
    rejected: jobs.filter(j => j.status === 'rejected').length,
  };

  const filters: Array<{ key: JobStatus | 'all'; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'wishlist', label: '⭐ Wishlist' },
    { key: 'applied', label: '📤 Applied' },
    { key: 'phone_screen', label: '📞 Phone' },
    { key: 'interview', label: '🎯 Interview' },
    { key: 'offer', label: '🎉 Offer' },
    { key: 'rejected', label: '❌ Rejected' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>JobTrackr</Text>
          <Text style={styles.headerSubtitle}>Your European Job Hunt</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/add-job')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Total" value={stats.total} color={COLORS.primary} />
          <StatCard label="Applied" value={stats.applied} color={COLORS.applied} />
          <StatCard label="Interview" value={stats.interview} color={COLORS.interview} />
          <StatCard label="Offers" value={stats.offer} color={COLORS.offer} />
        </View>

        {/* Progress bar */}
        {stats.total > 0 && (
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>Pipeline</Text>
            <View style={styles.progressBar}>
              {Object.entries(STATUS_COLORS).map(([status, color]) => {
                const count = jobs.filter(j => j.status === status).length;
                const pct = (count / stats.total) * 100;
                if (pct === 0) return null;
                return (
                  <View key={status} style={[styles.progressSegment, { width: `${pct}%`, backgroundColor: color }]} />
                );
              })}
            </View>
            <View style={styles.progressLegend}>
              {Object.entries(STATUS_LABELS).map(([status, label]) => {
                const count = jobs.filter(j => j.status === status as JobStatus).length;
                if (count === 0) return null;
                return (
                  <View key={status} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS[status as JobStatus] }]} />
                    <Text style={styles.legendText}>{label}: {count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {filters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterTab, activeFilter === f.key && styles.filterTabActive]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text style={[styles.filterTabText, activeFilter === f.key && styles.filterTabTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Jobs list */}
        <View style={styles.jobsSection}>
          <Text style={styles.sectionTitle}>
            {filteredJobs.length} {activeFilter === 'all' ? 'Applications' : STATUS_LABELS[activeFilter as JobStatus]}
          </Text>
          {filteredJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No applications yet</Text>
              <Text style={styles.emptySubtitle}>Tap the + button to add your first job application</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/add-job')}>
                <Text style={styles.emptyBtnText}>Add Application</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onPress={() => router.push({ pathname: '/job-detail', params: { id: job.id } })}
                onDelete={() => deleteJob(job.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, alignItems: 'center', borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  progressSection: { marginHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 10, marginHorizontal: 16 },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: COLORS.border, flexDirection: 'row', overflow: 'hidden', marginBottom: 8 },
  progressSegment: { height: '100%' },
  progressLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textMuted },
  filterScroll: { marginTop: 8 },
  filterContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterTabText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  filterTabTextActive: { color: 'white' },
  jobsSection: { paddingBottom: 32, marginTop: 12 },
  jobCard: { flexDirection: 'row', backgroundColor: COLORS.surface, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  jobCardAccent: { width: 4 },
  jobCardContent: { flex: 1, padding: 14 },
  jobCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  jobCardTitles: { flex: 1, marginRight: 8 },
  jobCompany: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  jobRole: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  deleteBtn: { padding: 4 },
  jobCardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  jobCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  jobMetaText: { fontSize: 11, color: COLORS.textMuted },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginLeft: 'auto' },
  statusText: { fontSize: 11, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { marginTop: 20, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  emptyBtnText: { color: 'white', fontWeight: '600', fontSize: 15 },
});
