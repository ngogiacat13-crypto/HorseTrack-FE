import React from 'react';

export const Panel: React.FC<{ title?: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode; children?: React.ReactNode; foot?: React.ReactNode; as?: 'h2' | 'h3'; id?: string; headStyle?: React.CSSProperties }> = ({ title, sub, right, children, foot, as = 'h2', id, headStyle }) => {
  const H = as;
  return (
    <section className="ht-panel" id={id}>
      {(title || right) && (
        <div className="ht-panel__head" style={headStyle}>
          {title ? <div><H>{title}</H>{sub && <p>{sub}</p>}</div> : null}
          {right}
        </div>
      )}
      {children}
      {foot && <div className="ht-panel__foot">{foot}</div>}
    </section>
  );
};
