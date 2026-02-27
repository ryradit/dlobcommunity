'use client';

import React from 'react';
import { motion, useInView } from 'framer-motion';

export function TimelineContent(props: any) {
  const { as = 'div', children, className = '', ...rest } = props;
  const ref = React.useRef<any>(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px -100px 0px' });

  const MotionComponent = (motion[as as keyof typeof motion] as any) || motion.div;

  return (
    <MotionComponent
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      custom={rest.animationNum}
      variants={rest.customVariants}
      className={className}
      {...rest}
    >
      {children}
    </MotionComponent>
  );
}
