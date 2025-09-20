import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authServices from "../services/authServices";
import type { IAlertInfo } from "../types/interfaces";
import AlertDialog from "./AlertDialog";

const Navbar = () => {
    const navigate = useNavigate();
    const [alert, setAlert] = useState<IAlertInfo | null>(null);
    const [isAuthPage, setIsAuthPage] = useState<boolean>(true);

    const logout = async(e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        try {
            const response: string = await authServices.logout();
            if(!response) throw new Error("Logout unsuccessful!")
            setAlert({isError: false, message: "Logout successful!"});
            navigate("/auth");

        } catch (error: any) {
            setAlert({isError: true, message: error.message});
        }
    }

    useEffect(() => {
        const url: string = window.location.pathname;
        const page: string = url.slice(url.lastIndexOf('/'), url.length);
        setIsAuthPage(page === '/auth');
    }, [navigate]);


    return (
        <div>
            <div className="bg-base-100 shadow-sm">
            <div className="navbar container mx-auto">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold">🧠cerebro</h1>
                    </div>
                </div>
                {
                    !isAuthPage && (
                        <div className="flex-none">
                            <button className="btn btn-ghost p-2 text-lg" onClick={logout}>logout</button>
                        </div>
                    )
                }
            </div>
        </div>
        {alert && (<AlertDialog {...alert!}/>)}
        </div>
    )
}

export default Navbar