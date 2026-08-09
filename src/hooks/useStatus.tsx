import React from 'react';
import {TextComponent} from '../components';
import {STATUS} from '../utils/constant';

export function useStatus(key: any) {
    const status = STATUS.find(status => status.key === key);
    return status ? (
        <TextComponent variant="titleMedium" style={{color: status.color}}>
            {status.value}
        </TextComponent>
    ) : null;
}
