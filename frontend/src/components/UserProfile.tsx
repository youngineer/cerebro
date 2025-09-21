import { useEffect, useState } from 'react'
import researchServices from '../services/researchServices';
import type { IAlertInfo, IBackendResponse, IResearchListDTO } from '../types/interfaces';
import AlertDialog from './AlertDialog';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const navigate = useNavigate();
    const [researchList, setResearchList] = useState<IResearchListDTO[] | null>(null);
    const [alert, setAlert] = useState<IAlertInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    let slNo: number = 0;

    useEffect(() => {
        setLoading(true);
        setAlert(null);

        const id = window.location.pathname.split("/").pop()!;
        (async function getResearchList(): Promise<void> {
            try {
                const response: IBackendResponse = await researchServices.getUserResearchList(id);
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

    if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner"></span>
      </div>
    );

    if(!researchList) return <div>Nothing to display</div>
  return (
    <div>
        {alert && <AlertDialog {...alert} />}
        <div className="overflow-x-auto min-w-3xl cursor-pointer">
            <table className="table">
                <thead>
                <tr>
                    <th></th>
                    <th>Topic Name</th>
                    <th>Status</th>
                </tr>
                </thead>
                <tbody>
                    {
                        researchList.map((research: IResearchListDTO) => {
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
    </div>
  )
}

export default UserProfile