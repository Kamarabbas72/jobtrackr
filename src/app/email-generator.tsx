import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
  Clipboard, KeyboardAvoidingView, Platform
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, Job, loadJobs, STATUS_LABELS } from './index';

const EMAIL_TYPES = [
  { key: 'followup', label: '📧 Follow Up', desc: 'Check in after applying' },
  { key: 'thankyou', label: '🙏 Thank You', desc: 'After an interview' },
  { key: 'negotiate', label: '💰 Negotiate', desc: 'Counter offer salary' },
  { key: 'withdraw', label: '❌ Withdraw', desc: 'Remove application' },
];

function generateEmail(job: Job, type: string, yourName: string): string {
  const company = job.company;
  const role = job.role;
  const contact = job.contactName || 'Hiring Manager';
  const name = yourName || 'Kamarabbas';

  switch (type) {
    case 'followup':
      return `Subject: Follow-up: ${role} Application — ${name}

Dear ${contact},

I hope this message finds you well.

I am writing to follow up on my application for the ${role} position at ${company}, which I submitted on ${job.dateApplied}. I remain very enthusiastic about this opportunity and would love to contribute my backend engineering expertise to your team.

I have over 3 years of experience building production Python and Odoo ERP systems, and I am particularly excited about ${company}'s work. I believe my skills in Python, PostgreSQL, and REST API development align well with this role.

Could you please let me know if there are any updates regarding the status of my application? I am happy to provide any additional information you may need.

Thank you very much for your time and consideration.

Best regards,
${name}`;

    case 'thankyou':
      return `Subject: Thank You — ${role} Interview at ${company}

Dear ${contact},

Thank you so much for taking the time to interview me for the ${role} position at ${company} today. It was a pleasure learning more about the team and the exciting work you are doing.

Our conversation reinforced my enthusiasm for this opportunity. I am particularly excited about [mention something specific discussed] and believe my background in Python backend development and system integration would allow me to contribute meaningfully from day one.

Please do not hesitate to reach out if you need any additional information. I look forward to hearing about the next steps.

Thank you again for your time.

Best regards,
${name}`;

    case 'negotiate':
      return `Subject: Re: Job Offer — ${role} at ${company}

Dear ${contact},

Thank you so much for offering me the ${role} position at ${company}. I am genuinely excited about this opportunity and am confident I can make a strong contribution to your team.

After careful consideration of the offer, I would like to discuss the compensation package. Based on my research of the market rate for this role in ${job.country} and my 3+ years of specialized experience in Python backend development and Odoo ERP systems, I was hoping we could discuss a base salary of [your target salary].

I want to be transparent that I am very enthusiastic about joining ${company} specifically, and I am confident we can find a package that works for both parties.

Could we schedule a brief call to discuss this further?

Thank you for your understanding.

Best regards,
${name}`;

    case 'withdraw':
      return `Subject: Withdrawal of Application — ${role}

Dear ${contact},

I hope you are well. I am writing to formally withdraw my application for the ${role} position at ${company}.

After careful consideration, I have decided to pursue a different opportunity that more closely aligns with my current career goals. This was not an easy decision, as I have great respect for ${company} and the team I had the opportunity to connect with.

I appreciate the time and consideration you invested in reviewing my application. I hope our paths may cross again in the future.

Thank you again for the opportunity.

Best regards,
${name}`;

    default:
      return '';
  }
}

export default function EmailGenerator() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedType, setSelectedType] = useState('followup');
  const [yourName, setYourName] = useState('Kamarabbas Bukhari');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [copied, setCopied] = useState(false);

  useFocusEffect(useCallback(() => {
    loadJobs().then(data => {
      const active = data.filter(j => !['rejected', 'withdrawn'].includes(j.status));
      setJobs(active);
      if (active.length > 0 && !selectedJob) setSelectedJob(active[0]);
    });
  }, []));

  const generate = () => {
    if (!selectedJob) { Alert.alert('Select a job first'); return; }
    const email = generateEmail(selectedJob, selectedType, yourName);
    setGeneratedEmail(email);
    setCopied(false);
  };

  const copyEmail = () => {
    if (!generatedEmail) return;
    Clipboard.setString(generatedEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Email Generator</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* Your Name */}
          <Text style={styles.sectionTitle}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={yourName}
            onChangeText={setYourName}
            placeholder="Your full name"
            placeholderTextColor={COLORS.textMuted}
          />

          {/* Select Job */}
          <Text style={styles.sectionTitle}>Select Job</Text>
          {jobs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No active applications found.</Text>
              <TouchableOpacity onPress={() => router.push('/add-job')}>
                <Text style={{ color: COLORS.primary, fontWeight: '600', marginTop: 8 }}>Add a job →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.jobChips}>
                {jobs.map(job => (
                  <TouchableOpacity
                    key={job.id}
                    style={[styles.jobChip, selectedJob?.id === job.id && styles.jobChipActive]}
                    onPress={() => { setSelectedJob(job); setGeneratedEmail(''); }}
                  >
                    <Text style={[styles.jobChipCompany, selectedJob?.id === job.id && { color: 'white' }]}>
                      {job.company}
                    </Text>
                    <Text style={[styles.jobChipRole, selectedJob?.id === job.id && { color: 'rgba(255,255,255,0.8)' }]} numberOfLines={1}>
                      {job.role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Email Type */}
          <Text style={styles.sectionTitle}>Email Type</Text>
          <View style={styles.typeGrid}>
            {EMAIL_TYPES.map(type => (
              <TouchableOpacity
                key={type.key}
                style={[styles.typeCard, selectedType === type.key && styles.typeCardActive]}
                onPress={() => { setSelectedType(type.key); setGeneratedEmail(''); }}
              >
                <Text style={styles.typeLabel}>{type.label}</Text>
                <Text style={[styles.typeDesc, selectedType === type.key && { color: 'rgba(255,255,255,0.8)' }]}>
                  {type.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Generate Button */}
          <TouchableOpacity style={styles.generateBtn} onPress={generate}>
            <Ionicons name="sparkles" size={18} color="white" />
            <Text style={styles.generateBtnText}>Generate Email</Text>
          </TouchableOpacity>

          {/* Generated Email */}
          {generatedEmail !== '' && (
            <View style={styles.emailCard}>
              <View style={styles.emailHeader}>
                <Text style={styles.emailTitle}>Generated Email</Text>
                <TouchableOpacity style={[styles.copyBtn, copied && styles.copyBtnSuccess]} onPress={copyEmail}>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={copied ? 'white' : COLORS.primary} />
                  <Text style={[styles.copyBtnText, copied && { color: 'white' }]}>
                    {copied ? 'Copied!' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.emailText}>{generatedEmail}</Text>
              <View style={styles.emailActions}>
                {selectedJob?.contactEmail && (
                  <TouchableOpacity
                    style={styles.emailActionBtn}
                    onPress={() => {
                      const subject = generatedEmail.split('\n')[0].replace('Subject: ', '');
                      const body = generatedEmail.split('\n').slice(2).join('\n');
                      const mailto = `mailto:${selectedJob.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      require('react-native').Linking.openURL(mailto);
                    }}
                  >
                    <Ionicons name="mail" size={16} color="white" />
                    <Text style={styles.emailActionText}>Open in Mail App</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
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
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 10 },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text },
  emptyCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 20, alignItems: 'center' },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  jobChips: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  jobChip: { backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 12, minWidth: 130 },
  jobChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  jobChipCompany: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  jobChipRole: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: { width: '47%', backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 14 },
  typeCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  typeDesc: { fontSize: 12, color: COLORS.textMuted },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, padding: 16, borderRadius: 14, marginTop: 20, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  generateBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  emailCard: { marginTop: 20, backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  emailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  emailTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary },
  copyBtnSuccess: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  copyBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  emailText: { fontSize: 13, color: COLORS.text, lineHeight: 20, fontFamily: 'monospace' },
  emailActions: { marginTop: 14, flexDirection: 'row', gap: 10 },
  emailActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  emailActionText: { color: 'white', fontSize: 13, fontWeight: '600' },
});
