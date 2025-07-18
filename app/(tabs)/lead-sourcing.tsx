import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { 
  Search, 
  Building, 
  MapPin, 
  Users, 
  Globe, 
  Mail,
  Zap,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useLeadSourcingStore } from '@/hooks/useLeadSourcingStore';
import { useHubSpotStore } from '@/hooks/useHubSpotStore';
import LeadCard from '@/components/LeadCard';

export default function LeadSourcingScreen() {
  const { 
    leads, 
    isLoading, 
    error, 
    searchLeads, 
    clearLeads,
    syncStatus 
  } = useLeadSourcingStore();
  
  const { syncStatus: hubspotStatus, syncLeadToHubSpot } = useHubSpotStore();
  
  const [searchQuery, setSearchQuery] = useState('Oil and Gas Oklahoma Kansas');
  const [syncingLeads, setSyncingLeads] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }
    
    await searchLeads(searchQuery);
  };

  const handleSyncLead = async (leadId: string) => {
    if (!hubspotStatus.isConfigured) {
      Alert.alert('Error', 'HubSpot is not configured. Please configure it in Settings.');
      return;
    }

    setSyncingLeads(prev => new Set(prev).add(leadId));
    
    try {
      const success = await syncLeadToHubSpot(leadId);
      if (success) {
        Alert.alert('Success', 'Lead synced to HubSpot successfully');
      } else {
        Alert.alert('Error', 'Failed to sync lead to HubSpot');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Sync failed: ${errorMessage}`);
    } finally {
      setSyncingLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(leadId);
        return newSet;
      });
    }
  };

  const handleSyncAllLeads = async () => {
    if (!hubspotStatus.isConfigured) {
      Alert.alert('Error', 'HubSpot is not configured. Please configure it in Settings.');
      return;
    }

    if (leads.length === 0) {
      Alert.alert('Error', 'No leads to sync');
      return;
    }

    Alert.alert(
      'Sync All Leads',
      `This will sync ${leads.length} leads to HubSpot. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sync All', 
          onPress: async () => {
            for (const lead of leads) {
              await handleSyncLead(lead.id);
            }
          }
        }
      ]
    );
  };

  const getSyncStatusIcon = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (syncingLeads.has(leadId)) {
      return <ActivityIndicator size="small" color={colors.primary} />;
    }
    if (lead?.syncedToHubSpot) {
      return <CheckCircle size={16} color={colors.success} />;
    }
    return <Zap size={16} color={colors.primary} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for companies..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.searchButton, isLoading && styles.disabledButton]} 
          onPress={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Search size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Building size={16} color={colors.primary} />
          <Text style={styles.statText}>{leads.length} leads found</Text>
        </View>
        
        <View style={styles.statItem}>
          <CheckCircle size={16} color={colors.success} />
          <Text style={styles.statText}>
            {leads.filter(l => l.syncedToHubSpot).length} synced
          </Text>
        </View>
        
        {hubspotStatus.isConfigured && leads.length > 0 && (
          <TouchableOpacity 
            style={styles.syncAllButton}
            onPress={handleSyncAllLeads}
          >
            <Zap size={14} color={colors.primary} />
            <Text style={styles.syncAllText}>Sync All</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => useLeadSourcingStore.getState().clearError()}>
            <Text style={styles.clearErrorText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {leads.length > 0 && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearLeads}
            >
              <RefreshCw size={16} color={colors.textSecondary} />
              <Text style={styles.clearButtonText}>Clear Results</Text>
            </TouchableOpacity>
          </View>
        )}

        {leads.map(lead => (
          <LeadCard 
            key={lead.id} 
            lead={lead}
            onSync={() => handleSyncLead(lead.id)}
            syncIcon={getSyncStatusIcon(lead.id)}
            canSync={hubspotStatus.isConfigured && !syncingLeads.has(lead.id)}
          />
        ))}

        {leads.length === 0 && !isLoading && !error && (
          <View style={styles.emptyContainer}>
            <Search size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Find Your Next Prospects</Text>
            <Text style={styles.emptyText}>
              Search for Oil & Gas companies in Oklahoma and Kansas to build your prospect list
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: colors.text,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  syncAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 115, 232, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    marginLeft: 'auto',
  },
  syncAllText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 67, 53, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 14,
  },
  clearErrorText: {
    color: colors.danger,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  content: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});