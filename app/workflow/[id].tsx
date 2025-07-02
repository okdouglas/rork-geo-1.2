import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Zap, ListChecks, Target } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWorkflowStore } from '@/hooks/useWorkflowStore';
import { useTemplateStore } from '@/hooks/useTemplateStore';
import WorkflowStep from '@/components/WorkflowStep';
import TemplatePreview from '@/components/TemplatePreview';

export default function WorkflowDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { workflows, selectedWorkflow, setSelectedWorkflow, updateWorkflowStep, toggleWorkflowActive } = useWorkflowStore();
  const { templates } = useTemplateStore();
  
  // Find the workflow and set it as selected
  React.useEffect(() => {
    const workflow = workflows.find(w => w.id === id);
    if (workflow) {
      setSelectedWorkflow(workflow);
    }
    
    return () => {
      setSelectedWorkflow(null);
    };
  }, [id, workflows, setSelectedWorkflow]);
  
  if (!selectedWorkflow) {
    return (
      <View style={styles.centeredContainer}>
        <Text>Workflow not found</Text>
      </View>
    );
  }
  
  const handleToggleStep = (step: any) => {
    updateWorkflowStep(selectedWorkflow.id, step);
  };
  
  const handleToggleActive = () => {
    toggleWorkflowActive(selectedWorkflow.id);
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.workflowName}>{selectedWorkflow.name}</Text>
          <Switch
            value={selectedWorkflow.isActive}
            onValueChange={handleToggleActive}
            trackColor={{ false: colors.border, true: 'rgba(26, 115, 232, 0.4)' }}
            thumbColor={selectedWorkflow.isActive ? colors.primary : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.triggerContainer}>
          <Zap size={16} color={colors.textSecondary} />
          <Text style={styles.triggerText}>{selectedWorkflow.trigger}</Text>
        </View>
      </View>
      
      <View style={styles.targetingCard}>
        <Text style={styles.sectionTitle}>Targeting Criteria</Text>
        
        <View style={styles.targetSection}>
          <Text style={styles.targetLabel}>Company Types:</Text>
          <View style={styles.tagsContainer}>
            {selectedWorkflow.targetCompanyTypes.map((type, index) => (
              <View key={`type-${index}`} style={styles.tag}>
                <Text style={styles.tagText}>{type}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.targetSection}>
          <Text style={styles.targetLabel}>Target Formations:</Text>
          <View style={styles.tagsContainer}>
            {selectedWorkflow.targetFormations.map((formation, index) => (
              <View key={`formation-${index}`} style={[styles.tag, styles.formationTag]}>
                <Text style={styles.tagText}>{formation}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      
      <View style={styles.stepsCard}>
        <View style={styles.sectionHeader}>
          <ListChecks size={18} color={colors.text} />
          <Text style={styles.sectionTitle}>Workflow Steps</Text>
        </View>
        
        <View style={styles.stepsContainer}>
          {selectedWorkflow.steps.map((step, index) => (
            <WorkflowStep 
              key={step.id} 
              step={step} 
              isFirst={index === 0}
              isLast={index === selectedWorkflow.steps.length - 1}
              onToggleComplete={handleToggleStep}
            />
          ))}
        </View>
      </View>
      
      <View style={styles.templatesCard}>
        <View style={styles.sectionHeader}>
          <Target size={18} color={colors.text} />
          <Text style={styles.sectionTitle}>Email Templates</Text>
        </View>
        
        {selectedWorkflow.steps
          .filter(step => step.type === 'Email' && step.templateId)
          .map(step => {
            const template = templates.find(t => t.id === step.templateId);
            if (!template) return null;
            
            return (
              <TemplatePreview key={template.id} template={template} />
            );
          })}
        
        {selectedWorkflow.steps.filter(step => step.type === 'Email' && step.templateId).length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No email templates in this workflow</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workflowName: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  triggerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triggerText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  targetingCard: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  targetSection: {
    marginBottom: 16,
  },
  targetLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(111, 207, 151, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  formationTag: {
    backgroundColor: 'rgba(26, 115, 232, 0.1)',
  },
  tagText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  stepsCard: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  stepsContainer: {
    marginLeft: 16,
  },
  templatesCard: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});