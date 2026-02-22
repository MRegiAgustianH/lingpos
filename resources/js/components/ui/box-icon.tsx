import React from 'react';

interface BoxIconProps extends React.HTMLAttributes<HTMLElement> {
    name: string;
}

export const BoxIcon: React.FC<BoxIconProps> = ({ name, className = '', ...props }) => {
    return <i className={`bx ${name} ${className}`} {...props}></i>;
};
