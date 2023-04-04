import * as React from 'react';

interface Props {
    setOpenModal: (openModal: boolean) => void;
}

export function Modal({setOpenModal}: Props) {
    return (
        <div
            className="modal"
            onClick={() => setOpenModal(false)}
        >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title">Papeo Reader 📄 📹</div>
                    <div className="modal-close" onClick={() => setOpenModal(false)}>
                    <i 
                        className="fa fa-times" 
                        aria-hidden="true"
                    ></i>
                    </div>
                </div>
                <div className="modal-body">
                    The <b>Papeo Reader</b> is an interactive reader to read <b>pap</b>ers augmented with their talk vid<b>eos</b>.
                </div>
                <div className="modal-body">
                    Details have been <b>anonymized</b>.
                </div>
            </div>
        </div>
    );
//   return (
//     <div
//         className="modal"
//         onClick={() => setOpenModal(false)}
//     >
//         <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//         <div className="modal-header">
//             <div className="modal-title">Papeo Reader 📄 📹</div>
//             <div className="modal-close" onClick={() => setOpenModal(false)}>
//             <i 
//                 className="fa fa-times" 
//                 aria-hidden="true"
//             ></i>
//             </div>
//         </div>
//         <div className="modal-body">
//             The <b>Papeo Reader</b> is an interactive reader to read <b>pap</b>ers augmented with their talk vid<b>eos</b>.
//         </div>
//         <div className="modal-body">
//             This interface is the result of an internship project in the <b>Semantic Scholar</b> team at the <b>Allen Institute for AI</b> (AI2). Our team is composed of <a href="https://taesookim.com">Tae Soo Kim</a> (KAIST), <a href="https://homes.cs.washington.edu/~axz/index.html">Amy X. Zhang</a> (University of Washington), <a href="https://www.jonathanbragg.com/">Jonathan Bragg</a> (AI2), <a href="https://joe.cat/">Joseph Chee Chang</a> (AI2), and <a href="https://www.linkedin.com/in/mlatzke">Matt Latzke</a> (AI2).
//         </div>
//         <div className="modal-body">
//             We are promoting the interface at <b>CSCW 2022</b> as part of a deployment study with the intention of understanding how the interface would be used by users in the wild. Our study has been approved by the <b>University of Washington IRB</b>.
//         </div>
//         <div className="modal-body">
//             The interface collects <b>NO personally identifiable information</b> and only logs interaction that occur within the interface.
//         </div>
//         <div className="modal-body">
//             <div className="modal-body-inner">
//                 <a className="modal-btn" href="https://papeo.app" target="_blank"><i className="fa-solid fa-house" aria-hidden="true"></i> Papeo Home</a>
//                 <a className="modal-btn" href="https://docs.google.com/document/d/1rT1MsJ0aN1CbEtfcW2R8kw4cRUa8M1-Y0b5XA4qavZY/edit?usp=sharing" target="_blank"><i className="fa-solid fa-circle-question"></i> Tutorial</a>
//                 <a className="modal-btn" href="https://forms.gle/V5fFxRaA8hzjzmoP8" target="_blank"><i className="fa-solid fa-upload"></i> Create Papeo</a>
//                 <a className="modal-btn"  href="https://forms.gle/jAv71LvjF4WuN17e7" target="_blank"><i className="fa-solid fa-message"></i>Feedback</a>
//             </div>
//         </div>
//         <div className="modal-body">
//             If you have any questions or feedback regarding the interface, you can also email us at <b>taesoo.kim@kaist.ac.kr</b>
//         </div>
//         </div>
//     </div>
//   );
}
