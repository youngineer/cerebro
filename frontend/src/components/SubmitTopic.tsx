import { useEffect, useState, type ChangeEvent } from 'react'
import researchServices from '../services/researchServices';
import { useNavigate } from 'react-router-dom';
import AlertDialog from './AlertDialog';

const SubmitTopic = () => {
    const navigate = useNavigate();
    const [topic, setTopic] = useState<string>("");
    const [isAuthPage, setIsAuthPage] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [alert, setAlert] = useState<{
        isError: boolean;
        message: string;
    } | null>(null);

    useEffect(() => {
        const url: string = window.location.pathname;
        const page: string = url.slice(url.lastIndexOf('/'), url.length);
        setIsAuthPage(page === '/auth');
    }, [navigate]);

    const handleSubmit = async () => {
        if (!topic.trim()) {
            setAlert({ isError: true, message: "Please enter a topic" });
            return;
        }

        setLoading(true);
        try {
            const response = await researchServices.postResearch(topic);
            setAlert({ isError: false, message: response.message || "Research queued successfully!" });
            setTopic("");
            (document.getElementById('my_modal_2') as HTMLDialogElement)?.close();
        } catch (error) {
            setAlert({ isError: true, message: String(error) });
        } finally {
            setLoading(false);
            setAlert(null);
        }
    };

    if(isAuthPage) return null;

  return (
    <div className='fixed right-4 top-20'>
        {alert && <AlertDialog {...alert} />}
        <button className="btn btn-success" onClick={() => (document.getElementById('my_modal_2') as HTMLDialogElement)?.showModal()}>
            Submit New Topic
        </button>
        <dialog id="my_modal_2" className="modal">
            <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">Submit Research Topic</h3>
                <fieldset className="fieldset">
                    <legend className="fieldset-legend">Please enter the topic:</legend>
                    <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="e.g., Climate change impact on agriculture"
                        value={topic}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
                        disabled={loading}
                    />
                </fieldset>
                <div className="modal-action">
                    <button
                        className={`btn btn-primary ${loading ? 'loading' : ''}`}
                        onClick={handleSubmit}
                        disabled={loading || !topic.trim()}
                    >
                        {loading ? 'Submitting...' : 'Submit'}
                    </button>
                    <button 
                        className="btn"
                        onClick={() => {
                            (document.getElementById('my_modal_2') as HTMLDialogElement)?.close();
                            setTopic("");
                        }}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </dialog>
    </div>
  )
}

export default SubmitTopic