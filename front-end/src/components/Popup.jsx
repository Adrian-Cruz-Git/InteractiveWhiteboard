import "./Popup.css";

const Popup = ({ trigger, setTrigger, children }) => {
  return trigger ? (
    <div className="popup">
      <div className="popup-inner">
        {children}
        <button className="close-btn" onClick={() => setTrigger(false)}>
          Close
        </button>
      </div>
    </div>
  ) : null;
};

export default Popup;
