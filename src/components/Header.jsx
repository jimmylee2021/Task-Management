import { FaPlus } from "react-icons/fa";
export const Header = ({onAddColumn})=> {
    return (
        <div className="header">
            <header>
                <h1>Task Manager</h1>
                <div className="column-btn">
                     <button onClick={onAddColumn}><FaPlus className="plus-icon"/>Column</button>
                </div>
            </header>
        </div>
    )
}