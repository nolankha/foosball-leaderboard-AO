import {record,sides,teamKey,type Match,type Player} from './game';

export const formatPercent=(wins:number,matches:number)=>`${new Intl.NumberFormat(undefined,{maximumFractionDigits:1}).format(matches?100*wins/matches:0)}%`;

export function PlayerRecord({ids,matches,players,range}:{ids:string[],matches:Match[],players:Player[],range:string}){
  const names=new Map(players.map(p=>[p.id,p.name]));
  const label=(side:string[])=>side.map(id=>names.get(id)||'Unknown').join(' + ');
  const team=ids.length===2;
  const file=record(ids,matches);
  const formats=team?['doubles']:['singles','doubles'];
  return <div className="player-file">
    <div className="eyebrow">PLAYER FILE / MATCH LOG <span className="file-period">{range==='today'?'TODAY':'ALL TIME'}</span></div>
    <h2>{label(ids)}</h2>
    <p className="file-description">{team?'Doubles team records, opponents, and every game played together.':'Singles and doubles are tracked separately. Rates appear after 10 matches in that format.'}</p>
    <section className={'file-rates '+(team?'team-rates':'')} aria-label={team?'Doubles team win rate':'Individual win rates'}>
      {formats.map(format=>{
        const games=file.history.filter(m=>m.format===format);
        const wins=games.filter(m=>sides(m)[0].includes(ids[0])).length;
        return <div className="file-rate" key={format}><label>{format.toUpperCase()}</label><strong>{games.length>=10?formatPercent(wins,games.length):'—'}</strong><span>{games.length>=10?`${wins} wins / ${games.length} matches`:`${games.length} / 10 matches to qualify`}</span></div>;
      })}
    </section>
    <p className="file-note">{team?'Only games played by this exact team are included.':'Doubles never count toward singles rates. Known player aliases are grouped.'}</p>
    <section className="file-head-to-head" aria-label="Head-to-head records">
      <div className="file-section-heading"><h3>HEAD-TO-HEAD</h3><span>WINS–LOSSES BY FORMAT</span></div>
      {ids.map(id=>{
        const opponents=new Map<string,{id:string,singles?:{wins:number,losses:number},doubles?:{wins:number,losses:number}}>();
        for(const e of Object.values(file.breakdown[id])){
          const opponent=opponents.get(e.id)||{id:e.id};
          if(e.format==='singles')opponent.singles=e;else opponent.doubles=e;
          opponents.set(e.id,opponent);
        }
        const total=(e:{singles?:{wins:number,losses:number},doubles?:{wins:number,losses:number}})=>(e.singles?.wins||0)+(e.singles?.losses||0)+(e.doubles?.wins||0)+(e.doubles?.losses||0);
        const rows=[...opponents.values()].sort((a,b)=>total(b)-total(a)||(names.get(a.id)||'').localeCompare(names.get(b.id)||''));
        return <div className="file-member" key={id}><h4>{names.get(id)}</h4>{rows.length?<ul>{rows.map(opponent=><li className="file-opponent" key={opponent.id}><div className="file-opponent-name"><span>VS.</span><strong>{names.get(opponent.id)}</strong></div><div className="file-format-counts">{formats.map(format=>{const value=format==='singles'?opponent.singles:opponent.doubles;return <div key={format}><label>{format.toUpperCase()}</label><b>{value?`${value.wins}–${value.losses}`:'—'}</b></div>;})}</div></li>)}</ul>:<p className="file-empty">No opponents in this period.</p>}</div>;
      })}
    </section>
    <section className="file-match-log" aria-label="Match history">
      <div className="file-section-heading"><h3>MATCH LOG</h3><span>{file.history.length} {file.history.length===1?'GAME':'GAMES'}</span></div>
      {file.history.length?<ol>{file.history.map((m,index)=>{
        const ss=sides(m);
        const side=ss.findIndex(s=>team?teamKey(s)===teamKey(ids):s.includes(ids[0]));
        const teammate=team?[]:ss[side].filter(id=>id!==ids[0]);
        const won=side===0;
        return <li className="file-game" key={m.id}><span className="file-game-number">{String(index+1).padStart(2,'0')}</span><div className="file-game-detail"><span className={'file-game-outcome '+(won?'is-win':'is-loss')}>{won?'WIN':'LOSS'} · {m.format.toUpperCase()}</span><strong>{teammate.length?`With ${label(teammate)} · `:''}vs. {label(ss[1-side])}</strong>{(m.winner_score!==null||m.loser_score!==null)&&<span className="file-game-score">WINNER {m.winner_score??'—'} · LOSER {m.loser_score??'—'}</span>}</div><time dateTime={new Date(m.created_at).toISOString()}>{new Date(m.created_at).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}</time></li>;
      })}</ol>:<p className="file-empty">No matches in this period.</p>}
    </section>
  </div>;
}
