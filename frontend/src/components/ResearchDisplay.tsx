import { useEffect, useState } from 'react';
import {
  type IResearchTopic,
  type IBackendResponse,
  type ISummary,
  type ILog,
} from '../types/interfaces';
import researchServices from '../services/researchServices';
import AlertDialog from './AlertDialog';
import { useNavigate } from 'react-router-dom';

const ResearchDisplay = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<IResearchTopic | null>(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    isError: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const id = window.location.pathname.split("/").pop()!;
    setLoading(true);

    researchServices
      .getResearch(id)
      .then((res: IBackendResponse) => setData(res.content))
      .catch((e) => setAlert({ isError: true, message: String(e) }))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner"></span>
      </div>
    );

  if (!data) return <div className="alert alert-error m-4">Research not found</div>;

  const { topic, status, createdAt, result, logs, user } = data;

  const badge =
    status === 'COMPLETED'
      ? 'badge-success'
      : status === 'IN_PROGRESS'
      ? 'badge-info'
      : status === 'FAILED'
      ? 'badge-error'
      : 'badge-warning';

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
        
      {alert && <AlertDialog {...alert} />}
      <div className="tooltip" data-tip={`Click to view ${user?.name}'s topics`}>
        <span>Created by: </span>
        <button className="btn btn-ghost btn-info min-w-auto" onClick={() => navigate(`/user/${data?.userId}`)}>
          {user?.name}
        </button>
      </div>
      <div className="card shadow">
        <div className="card-body">
          <div className="flex justify-between items-center">
            <h2 className="card-title">{topic}</h2>
            <div className={`badge ${badge}`}>{status}</div>
          </div>
          <div className="space-y-2">
            <p className="text-sm ">
              Started: {new Date(createdAt).toLocaleString()}
            </p>
            {result?.createdAt && (
              <p >
                Completed: {new Date(result.createdAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {result?.summaries && (
        <div className="card shadow">
          <div className="card-body">
            <h3 className="mb-2">Summary</h3>

            {typeof result.summaries === 'string' ? (
              <p className="">{result.summaries}</p>
            ) : Array.isArray(result.summaries) && result.summaries.length > 0 ? (
              result.summaries.map((s: ISummary, i) => (
                <p key={i} className="mb-1">
                  <span className="font-bold">{s.title}:</span> {s.summary}
                </p>
              ))
            ) : (
              <p className="">No summary available</p>
            )}

          </div>
        </div>
      )}

      {result?.keywords?.length > 0 && (
        <div className="card shadow">
          <div className="card-body flex flex-wrap gap-2">
            {result.keywords.map((k, i) => (
              <span key={i} className="badge badge-primary">
                {k}
              </span>
            ))}
          </div>
        </div>
      )}

      {logs?.length > 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="mb-2">Processing Logs</h3>
            <div className="space-y-1">
              {logs.map((l: ILog, i) => (
                <div key={l.id} className="text-xs pl-2">
                  <span className=" text-gray-500">[{i + 1}]</span> {l.message}
                  <div className="text-gray-400 text-xs mt-1">
                    {new Date(l.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {user && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="font-semibold mb-2">Research Details</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Researcher: {user.name}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default ResearchDisplay;
