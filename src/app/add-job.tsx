import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STATUS_LABELS, Job, JobStatus, loadJobs, saveJobs } from './index';

const SOURCES = ['LinkedIn', 'Company Website', 'Referral', 'Indeed', 'Glassdoor', 'XING', 'StepStone', 'Other'];
const COUNTRIES = ['Germany', 'Netherlands', 'Belgium', 'Portugal', 'Austria', 'Switzerland', 'Denmark', 'Sweden', 'Other'];
const STATUSES: JobStatus[] = ['wishlist', 'applied', 'phone_screen', 'interview', 'offer', 'rejected'];

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{required && <Text style={{ color: 'red' }}> *</Text>}</Text>
      {children}
    </View>
  );
}

function ChipSelect({ options, value, onChange, colorMap }: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  colorMap?: Record<string, string>;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.chipRow}>
        {options.map(opt => {
          const selected = value === opt;
          const color = colorMap?.[opt] || COLORS.primary;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, selected && { backgroundColor: color, borderColor: color }]}
              onPress={() => onChange(opt)}
            >
              <Text style={[styles.chipText, selected && { color: 'white' }]}>
                {STATUS_LABELS[opt as JobStatus] || opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default function AddJob() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    company: '',
    role: '',
    location: '',
    country: 'Germany',
    salary: '',
    jobUrl: '',
    source: 'LinkedIn',
    status: 'applied' as JobStatus,
    dateApplied: new Date().toISOString().split('T')[0],
    notes: '',
    contactName: '',
    contactEmail: '',
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!form.company.trim()) { Alert.alert('Required', 'Please enter the company name'); return; }
    if (!form.role.trim()) { Alert.alert('Required', 'Please enter the job role'); return; }

    setLoading(true);
    try {
      const jobs = await loadJobs();
      const newJob: Job = {
        id: Date.now().toString(),
        ...form,
        createdAt: new Date().toISOString(),
      };
      await saveJobs([...jobs, newJob]);
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Application</Text>
          <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={save} disabled={loading}>
            <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* Job Info */}
          <Text style={styles.sectionTitle}>Job Details</Text>

          <FormField label="Company" required>
            <TextInput
              style={styles.input}
              placeholder="e.g. Siemens, ASML, SAP"
              placeholderTextColor={COLORS.textMuted}
              value={form.company}
              onChangeText={v => update('company', v)}
            />
          </FormField>

          <FormField label="Role / Position" required>
            <TextInput
              style={styles.input}
              placeholder="e.g. Senior Backend Developer"
              placeholderTextColor={COLORS.textMuted}
              value={form.role}
              onChangeText={v => update('role', v)}
            />
          </FormField>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormField label="City">
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Berlin"
                  placeholderTextColor={COLORS.textMuted}
                  value={form.location}
                  onChangeText={v => update('location', v)}
                />
              </FormField>
            </View>
          </View>

          <FormField label="Country">
            <ChipSelect options={COUNTRIES} value={form.country} onChange={v => update('country', v)} />
          </FormField>

          <FormField label="Salary Range">
            <TextInput
              style={styles.input}
              placeholder="e.g. €60,000 - €80,000"
              placeholderTextColor={COLORS.textMuted}
              value={form.salary}
              onChangeText={v => update('salary', v)}
            />
          </FormField>

          <FormField label="Job URL">
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor={COLORS.textMuted}
              value={form.jobUrl}
              onChangeText={v => update('jobUrl', v)}
              keyboardType="url"
              autoCapitalize="none"
            />
          </FormField>

          {/* Status */}
          <Text style={styles.sectionTitle}>Status</Text>
          <FormField label="Current Status">
            <ChipSelect
              options={STATUSES}
              value={form.status}
              onChange={v => update('status', v as JobStatus)}
            />
          </FormField>

          <FormField label="Date Applied">
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.textMuted}
              value={form.dateApplied}
              onChangeText={v => update('dateApplied', v)}
            />
          </FormField>

          {/* Source */}
          <Text style={styles.sectionTitle}>How did you find it?</Text>
          <FormField label="Source">
            <ChipSelect options={SOURCES} value={form.source} onChange={v => update('source', v)} />
          </FormField>

          {/* Contact */}
          <Text style={styles.sectionTitle}>Recruiter / Contact</Text>

          <FormField label="Contact Name">
            <TextInput
              style={styles.input}
              placeholder="Recruiter name"
              placeholderTextColor={COLORS.textMuted}
              value={form.contactName}
              onChangeText={v => update('contactName', v)}
            />
          </FormField>

          <FormField label="Contact Email">
            <TextInput
              style={styles.input}
              placeholder="recruiter@company.com"
              placeholderTextColor={COLORS.textMuted}
              value={form.contactEmail}
              onChangeText={v => update('contactEmail', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </FormField>

          {/* Notes */}
          <Text style={styles.sectionTitle}>Notes</Text>
          <FormField label="Notes">
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Interview prep notes, questions asked, salary negotiation..."
              placeholderTextColor={COLORS.textMuted}
              value={form.notes}
              onChangeText={v => update('notes', v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </FormField>

          <TouchableOpacity style={[styles.saveBtnFull, loading && { opacity: 0.6 }]} onPress={save} disabled={loading}>
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.saveBtnFullText}>{loading ? 'Saving...' : 'Save Application'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: COLORS.text },
  saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 12 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text },
  textArea: { height: 100, paddingTop: 12 },
  row: { flexDirection: 'row', gap: 10 },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  chipText: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
  saveBtnFull: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, padding: 16, borderRadius: 14, marginTop: 24, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  saveBtnFullText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
