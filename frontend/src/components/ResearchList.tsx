import { useEffect, useState, type FC, type JSX } from 'react'
import type { IResearchListDTO, IBackendResponse, IAlertInfo } from '../types/interfaces'
import researchServices from '../services/researchServices';
import AlertDialog from './AlertDialog';
import { useNavigate } from 'react-router-dom';
import { getDateTime } from '../utils/helperFunctions';

const ResearchList: FC  = (): JSX.Element => {
    const navigate = useNavigate();
    const [researchList, setResearchList] = useState<IResearchListDTO[] | null>(null);
    const [alert, setAlert] = useState<IAlertInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    let slNo: number = 0;

    function loadResearch(researchId: string) {
        navigate(`/research/${researchId}`);
    }
    useEffect(() => {
        setLoading(true);
        setAlert(null);
        (async function getResearchList(): Promise<void> {
            try {
                const response: IBackendResponse = await researchServices.getResearchList();
                setAlert({ isError: false, message: response?.message });
                setResearchList(response?.content);
            } catch (error: any) {
                console.error(error);
                setAlert({ isError: true, message: String(error) });
            } finally {
                setAlert(null);
                setLoading(false);
            }
        })();
    }, [])

    if(!researchList) return <div>Nothing to display</div>
  return (
    <div>
        {alert && <AlertDialog {...alert} />}
        <div className="overflow-x-auto min-w-3xl cursor-pointer">
            <table className="table">
                {/* head */}
                <thead>
                <tr>
                    <th></th>
                    <th>Topic Name</th>
                    <th>Status</th>
                </tr>
                </thead>
                <tbody>
                    {
                        researchList.map((research, ) => {
                            return (
                                <tr className="hover:bg-base-300" id={research?.id} onClick={() => navigate(`/research/${research?.id}`)}>
                                    <th>{slNo++}</th>
                                    <td>{research?.topic}</td>
                                    <td>{research?.status}</td>
                                </tr>
                            )
                        })
                    }
                </tbody>
            </table>
            </div>
        {loading && <span className="loading loading-spinner loading-xl"></span>}
    </div>
  )
}

export default ResearchList