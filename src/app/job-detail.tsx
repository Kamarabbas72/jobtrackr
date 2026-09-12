import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput, Alert, Linking
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STATUS_LABELS, STATUS_COLORS, Job, JobStatus, loadJobs, saveJobs } from './index';

const STATUSES: JobStatus[] = ['wishlist', 'applied', 'phone_screen', 'interview', 'offer', 'rejected'];

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={16} color={COLORS.primary} style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function JobDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');

  useFocusEffect(useCallback(() => {
    loadJobs().then(jobs => {
      const found = jobs.find(j => j.id === id);
      if (found) { setJob(found); setNotes(found.notes || ''); }
    });
  }, [id]));

  const updateStatus = async (status: JobStatus) => {
    if (!job) return;
    const jobs = await loadJobs();
    const updated = jobs.map(j => j.id === id ? { ...j, status } : j);
    await saveJobs(updated);
    setJob(prev => prev ? { ...prev, status } : null);
  };

  const saveNotes = async () => {
    if (!job) return;
    const jobs = await loadJobs();
    const updated = jobs.map(j => j.id === id ? { ...j, notes } : j);
    await saveJobs(updated);
    setJob(prev => prev ? { ...prev, notes } : null);
    setEditingNotes(false);
  };

  const deleteJob = () => {
    Alert.alert('Delete Application', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const jobs = await loadJobs();
          await saveJobs(jobs.filter(j => j.id !== id));
          router.back();
        }
      }
    ]);
  };

  if (!job) return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: COLORS.textMuted }}>Loading...</Text>
      </View>
    </SafeAreaView>
  );

  const statusColor = STATUS_COLORS[job.status];
  const daysAgo = Math.floor((Date.now() - new Date(job.dateApplied).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{job.company}</Text>
        <TouchableOpacity onPress={deleteJob} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { borderBottomColor: statusColor }]}>
          <View style={[styles.companyInitial, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.initialText, { color: statusColor }]}>
              {job.company.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.heroCompany}>{job.company}</Text>
          <Text style={styles.heroRole}>{job.role}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
            <Text style={styles.statusPillText}>{STATUS_LABELS[job.status]}</Text>
          </View>
          <Text style={styles.heroMeta}>
            {job.location}, {job.country} · Applied {daysAgo === 0 ? 'today' : `${daysAgo} days ago`}
          </Text>
        </View>

        {/* Update Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.statusRow}>
              {STATUSES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusBtn, job.status === s && { backgroundColor: STATUS_COLORS[s], borderColor: STATUS_COLORS[s] }]}
                  onPress={() => updateStatus(s)}
                >
                  <Text style={[styles.statusBtnText, job.status === s && { color: 'white' }]}>
                    {STATUS_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.card}>
            <InfoRow icon="location-outline" label="Location" value={`${job.location}, ${job.country}`} />
            <InfoRow icon="cash-outline" label="Salary" value={job.salary} />
            <InfoRow icon="calendar-outline" label="Applied" value={job.dateApplied} />
            <InfoRow icon="search-outline" label="Source" value={job.source} />
            {job.jobUrl && (
              <TouchableOpacity style={styles.infoRow} onPress={() => Linking.openURL(job.jobUrl!)}>
                <Ionicons name="link-outline" size={16} color={COLORS.primary} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Job URL</Text>
                  <Text style={[styles.infoValue, { color: COLORS.primary }]} numberOfLines={1}>Open Job Posting ↗</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Contact */}
        {(job.contactName || job.contactEmail) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recruiter</Text>
            <View style={styles.card}>
              <InfoRow icon="person-outline" label="Name" value={job.contactName} />
              {job.contactEmail && (
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => Linking.openURL(`mailto:${job.contactEmail}`)}
                >
                  <Ionicons name="mail-outline" size={16} color={COLORS.primary} style={styles.infoIcon} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={[styles.infoValue, { color: COLORS.primary }]}>{job.contactEmail}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TouchableOpacity onPress={() => editingNotes ? saveNotes() : setEditingNotes(true)}>
              <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: 14 }}>
                {editingNotes ? 'Save' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>
          {editingNotes ? (
            <TextInput
              style={[styles.card, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Add interview notes, questions, salary negotiation details..."
              placeholderTextColor={COLORS.textMuted}
              textAlignVertical="top"
              autoFocus
            />
          ) : (
            <TouchableOpacity style={styles.card} onPress={() => setEditingNotes(true)}>
              <Text style={job.notes ? styles.notesText : styles.notesPlaceholder}>
                {job.notes || 'Tap to add notes...'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {job.contactEmail && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL(`mailto:${job.contactEmail}?subject=Follow up - ${job.role} position`)}
              >
                <Ionicons name="mail" size={22} color={COLORS.primary} />
                <Text style={styles.actionBtnText}>Send Email</Text>
              </TouchableOpacity>
            )}
            {job.jobUrl && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL(job.jobUrl!)}
              >
                <Ionicons name="globe" size={22} color={COLORS.primary} />
                <Text style={styles.actionBtnText}>View Job</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Linking.openURL(`https://linkedin.com/company/${job.company.toLowerCase().replace(/\s/g, '-')}`)}
            >
              <Ionicons name="logo-linkedin" size={22} color={COLORS.primary} />
              <Text style={styles.actionBtnText}>LinkedIn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', color: COLORS.text, textAlign: 'center', marginHorizontal: 8 },
  deleteBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  hero: { backgroundColor: COLORS.surface, padding: 24, alignItems: 'center', borderBottomWidth: 3, marginBottom: 8 },
  companyInitial: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  initialText: { fontSize: 28, fontWeight: '700' },
  heroCompany: { fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  heroRole: { fontSize: 16, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
  statusPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  statusPillText: { color: 'white', fontWeight: '600', fontSize: 13 },
  heroMeta: { fontSize: 13, color: COLORS.textMuted, marginTop: 8, textAlign: 'center' },
  section: { marginBottom: 4, paddingHorizontal: 16, paddingVertical: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  card: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoIcon: { marginRight: 12, marginTop: 2 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue: { fontSize: 15, color: COLORS.text, marginTop: 2, fontWeight: '500' },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  statusBtnText: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
  notesInput: { minHeight: 120, fontSize: 15, color: COLORS.text, lineHeight: 22 },
  notesText: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
  notesPlaceholder: { fontSize: 15, color: COLORS.textMuted, fontStyle: 'italic' },
  actionsGrid: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
});
