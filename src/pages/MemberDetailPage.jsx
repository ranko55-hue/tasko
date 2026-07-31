import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrg } from '../lib/orgContext';
import { isAdmin, isManager } from '../lib/roles';
import { useTeamMember } from '../hooks/useTeamMember';
import { useTeamList } from '../hooks/useTeamList';
import { useMemberStats } from '../hooks/useMemberStats';
import { useMemberTasks } from '../hooks/useMemberTasks';
import { useEmployeeEvaluations } from '../hooks/useEmployeeEvaluations';
import { useEmployeeDocuments } from '../hooks/useEmployeeDocuments';
import { he } from '../locales/he';
import Card from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import MemberHeaderCard from '../components/team/MemberHeaderCard';
import MemberDetailsTab from '../components/team/MemberDetailsTab';
import MemberTasksTab from '../components/team/MemberTasksTab';
import MemberPerformanceTab from '../components/team/MemberPerformanceTab';
import MemberDocumentsTab from '../components/team/MemberDocumentsTab';
import MemberActivityTab from '../components/team/MemberActivityTab';

const t = he.team.detail;
const TABS = ['details', 'tasks', 'performance', 'documents', 'activity'];

export default function MemberDetailPage() {
  const { memberId } = useParams();
  const { member: me } = useOrg();
  const { member, loading, error, refetch } = useTeamMember(memberId, me.org_id);
  const { members } = useTeamList(me.org_id);
  const { stats, loading: statsLoading } = useMemberStats(memberId, me.org_id);
  const memberTasks = useMemberTasks(memberId, me.org_id);
  const evals = useEmployeeEvaluations(memberId, me.org_id);
  const docs = useEmployeeDocuments(memberId, me.org_id);
  const [tab, setTab] = useState('details');

  const admin = isAdmin(me);
  const isDirectManager = member?.manager_id === me.id;
  const canEdit = admin || isDirectManager;
  const canWriteEval = admin || isDirectManager;
  const mgr = members.find((m) => m.id === member?.manager_id);

  const tabItems = TABS.map((key) => ({ key, label: t.tabs[key] }));

  if (loading) return <p className="py-12 text-center text-lg text-slate-500">{he.common.loading}</p>;
  if (error || !member) {
    return (
      <p className="py-12 text-center text-lg text-slate-500">{he.team.loadError}</p>
    );
  }

  function renderTab() {
    if (tab === 'details') {
      return <MemberDetailsTab member={member} canEdit={canEdit} onRefresh={refetch} />;
    }
    if (tab === 'tasks') {
      return (
        <MemberTasksTab
          tasks={memberTasks.tasks}
          loading={memberTasks.loading}
          orgId={me.org_id}
          isManager={isManager(me)}
        />
      );
    }
    if (tab === 'performance') {
      return (
        <MemberPerformanceTab
          stats={stats}
          evaluations={evals.evaluations}
          canWrite={canWriteEval}
          onAddEvaluation={evals.addEvaluation}
          loading={statsLoading || evals.loading}
        />
      );
    }
    if (tab === 'documents') {
      return (
        <MemberDocumentsTab
          memberId={memberId}
          orgId={me.org_id}
          documents={docs.documents}
          loading={docs.loading}
          onAdd={docs.addDocument}
          onRemove={docs.removeDocument}
        />
      );
    }
    if (tab === 'activity') {
      return <MemberActivityTab memberId={memberId} orgId={me.org_id} />;
    }
    return null;
  }

  return (
    <>
      <Link to="/team" className="text-base font-medium text-brand hover:underline">
        ‹ {t.back}
      </Link>

      <Card className="mt-2 overflow-hidden">
        <MemberHeaderCard member={member} stats={stats} managerName={mgr?.full_name} />
        <Tabs tabs={tabItems} active={tab} onChange={setTab} />
        <div className="p-4">{renderTab()}</div>
      </Card>
    </>
  );
}
