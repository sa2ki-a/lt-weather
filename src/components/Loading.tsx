export function Loading(){return <div className="state"><span className="spinner"/>予報を読み込んでいます…</div>}
export function ErrorState({message,retry}:{message:string;retry:()=>void}){return <div className="state error"><strong>取得できませんでした</strong><span>{message}</span><button onClick={retry}>再読み込み</button></div>}
