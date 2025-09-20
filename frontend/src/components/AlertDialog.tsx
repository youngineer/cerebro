import { useState, useEffect } from 'react'
import type { IAlertInfo } from '../types/interfaces';

const AlertDialog = (alert: IAlertInfo) => {
    const className = alert.isError ? "alert alert-error" : "alert alert-success";
    const [showAlert, setShowAlert] = useState<boolean>(true);
    useEffect(() => {
        if (!showAlert) return;
        const t = setTimeout(() => {
            setShowAlert(false);
        }, 3000);
        return () => clearTimeout(t);
    }, [showAlert]);
    
    if (!showAlert) return null;

    return (
        <div className="toast toast-top toast-end">
            <div className={className}>
                <span>{alert.message}</span>
            </div>
        </div>
    )
}

export default AlertDialog;