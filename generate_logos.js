const fs = require('fs');

const svgData = fs.readFileSync('public/images/logo-traced.svg', 'utf8');
const match = svgData.match(/d="([^"]+)"/);
const pathStr = match[1];
const subPaths = pathStr.split(/(?=M)/);

const cloudPaths = subPaths.slice(0, 5).join('');
const textPaths = subPaths.slice(5).join('');

const fullPaths = cloudPaths + textPaths;

// Cloud only ViewBox
// Min X: 197.7, Max X: 1061.3, Min Y: 204.9, Max Y: 768.9
const cloudViewBox = "197 204 865 565";

// Full ViewBox
// Min X: 155.8, Max X: 1099.0, Min Y: 204.9, Max Y: 1066.0
const fullViewBox = "155 204 945 862";

const logoMarkCode = `import styles from './LogoMark.module.css';

type LogoMarkProps = {
  size?: number | string;
  className?: string;
};

export default function LogoMark({ size = 40, className }: LogoMarkProps) {
  const wrapperClassName = className
    ? \`\${styles.logoMark} \${className}\`
    : styles.logoMark;

  return (
    <span className={wrapperClassName} style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="${cloudViewBox}" 
        width="100%" 
        height="100%"
        fill="currentColor"
      >
        <path d="${cloudPaths}" />
      </svg>
    </span>
  );
}
`;

const logoFullCode = `import styles from './LogoMark.module.css';

type LogoFullProps = {
  width?: number | string;
  height?: number | string;
  className?: string;
};

export default function LogoFull({ width = 120, height = 'auto', className }: LogoFullProps) {
  const wrapperClassName = className
    ? \`\${styles.logoMark} \${className}\`
    : styles.logoMark;

  return (
    <span className={wrapperClassName} style={{ width, height, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="${fullViewBox}" 
        width="100%" 
        height="100%"
        fill="currentColor"
      >
        <path d="${fullPaths}" />
      </svg>
    </span>
  );
}
`;

fs.writeFileSync('src/components/layout/LogoMark.tsx', logoMarkCode);
fs.writeFileSync('src/components/layout/LogoFull.tsx', logoFullCode);

console.log('Successfully generated LogoMark.tsx and LogoFull.tsx');
