import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import WizardStepper from '../../components/ui/WizardStepper';
import CustomerStep from './steps/CustomerStep';
import EngagementStep from './steps/EngagementStep';
import ScopeStep from './steps/ScopeStep';
import ResourcePlanStep from './steps/ResourcePlanStep';
import MilestoneStep from './steps/MilestoneStep';
import GovernanceStep from './steps/GovernanceStep';
import ReviewStep from './steps/ReviewStep';
import type { ResourceLine } from '../../components/sow/ResourceLineTable';
import type { Milestone } from '../../components/sow/MilestoneTable';

interface MarginResult {
  totalRevenue: number;
  totalCost: number;
  marginPercent: number;
  approvalLevel: string;
  approvers: string[];
  approvalDescription: string;
}

const BASE_STEPS = [
  { title: 'Customer' },
  { title: 'Engagement' },
  { title: 'Scope' },
  { title: 'Resource Plan' },
  { title: 'Governance' },
  { title: 'Review' },
];

const STEPS_WITH_MILESTONES = [
  { title: 'Customer' },
  { title: 'Engagement' },
  { title: 'Scope' },
  { title: 'Resource Plan' },
  { title: 'Milestones' },
  { title: 'Governance' },
  { title: 'Review' },
];

export default function SOWWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // SOW state
  const [sowId, setSowId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [autoPopulated, setAutoPopulated] = useState<Record<string, any>>({});
  const [engagement, setEngagement] = useState({
    templateId: '',
    title: '',
    startDate: '',
    endDate: '',
  });
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [resourceLines, setResourceLines] = useState<ResourceLine[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [marginResult, setMarginResult] = useState<MarginResult | null>(null);

  const isFixedFee = engagement.templateId === 'TPL-FIXED-FEE';
  const steps = isFixedFee ? STEPS_WITH_MILESTONES : BASE_STEPS;

  // Map step index to correct component depending on template
  const getStepContent = () => {
    if (isFixedFee) {
      switch (currentStep) {
        case 0: return <CustomerStep customerId={customerId} onChange={setCustomerId} autoPopulated={autoPopulated} onAutoPopulate={setAutoPopulated} />;
        case 1: return <EngagementStep data={engagement} onChange={(u) => setEngagement((p) => ({ ...p, ...u }))} />;
        case 2: return <ScopeStep formData={formData} onChange={(u) => setFormData((p) => ({ ...p, ...u }))} />;
        case 3: return <ResourcePlanStep sowId={sowId} resourceLines={resourceLines} onLinesChange={setResourceLines} marginResult={marginResult} onMarginChange={setMarginResult} />;
        case 4: return <MilestoneStep milestones={milestones} onChange={setMilestones} totalSOWValue={marginResult?.totalRevenue ?? 0} />;
        case 5: return <GovernanceStep formData={formData} onChange={(u) => setFormData((p) => ({ ...p, ...u }))} msaId={autoPopulated.msaId} templateType={engagement.templateId === 'TPL-LEAN-TM' ? 'lean_tm' : engagement.templateId === 'TPL-ELAB-TM' ? 'elaborate_tm' : 'fixed_fee'} customerId={customerId} />;
        case 6: return <ReviewStep customerId={customerId} customerName={autoPopulated.customerName ?? ''} templateId={engagement.templateId} title={engagement.title} startDate={engagement.startDate} endDate={engagement.endDate} formData={formData} resourceLines={resourceLines} marginResult={marginResult} />;
      }
    } else {
      switch (currentStep) {
        case 0: return <CustomerStep customerId={customerId} onChange={setCustomerId} autoPopulated={autoPopulated} onAutoPopulate={setAutoPopulated} />;
        case 1: return <EngagementStep data={engagement} onChange={(u) => setEngagement((p) => ({ ...p, ...u }))} />;
        case 2: return <ScopeStep formData={formData} onChange={(u) => setFormData((p) => ({ ...p, ...u }))} />;
        case 3: return <ResourcePlanStep sowId={sowId} resourceLines={resourceLines} onLinesChange={setResourceLines} marginResult={marginResult} onMarginChange={setMarginResult} />;
        case 4: return <GovernanceStep formData={formData} onChange={(u) => setFormData((p) => ({ ...p, ...u }))} msaId={autoPopulated.msaId} templateType={engagement.templateId === 'TPL-LEAN-TM' ? 'lean_tm' : engagement.templateId === 'TPL-ELAB-TM' ? 'elaborate_tm' : 'fixed_fee'} customerId={customerId} />;
        case 5: return <ReviewStep customerId={customerId} customerName={autoPopulated.customerName ?? ''} templateId={engagement.templateId} title={engagement.title} startDate={engagement.startDate} endDate={engagement.endDate} formData={formData} resourceLines={resourceLines} marginResult={marginResult} />;
      }
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  // Create SOW draft after step 1 (customer + engagement selected)
  const handleNext = async () => {
    if (currentStep === 1 && !sowId) {
      // Create draft SOW
      try {
        const { data } = await api.post('/sows', {
          templateId: engagement.templateId,
          customerId,
          title: engagement.title,
          startDate: engagement.startDate,
          endDate: engagement.endDate,
        });
        setSowId(data.id);
        toast.success(`SOW draft created: ${data.id}`);
      } catch (err: any) {
        toast.error(err.response?.data?.error ?? 'Failed to create SOW');
        return;
      }
    }

    // Save progress on each step
    if (sowId && currentStep >= 2) {
      try {
        await api.put(`/sows/${sowId}`, {
          title: engagement.title,
          formData,
        });
      } catch {
        // silently save — don't block navigation
      }
    }

    setCurrentStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!sowId) return;

    const validLines = resourceLines.filter((l) => l.roleId && l.locationId && l.hours > 0 && l.billRate > 0);
    if (validLines.length === 0) {
      toast.error('Add at least one resource line');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/sows/${sowId}/submit`, { resourceLines: validLines });
      toast.success('SOW submitted for approval');
      navigate('/sows');
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to submit SOW');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: return !!customerId;
      case 1: return !!engagement.templateId && !!engagement.title && !!engagement.startDate && !!engagement.endDate;
      default: return true;
    }
  }, [currentStep, customerId, engagement]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Statement of Work</h1>
        {sowId && <p className="text-sm text-gray-500 mt-1">Draft ID: {sowId}</p>}
      </div>

      <WizardStepper steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{steps[currentStep].title}</h2>
        {getStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={currentStep === 0}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/sows')}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Save & Exit
          </button>

          {isLastStep ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || !marginResult}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit for Approval'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
