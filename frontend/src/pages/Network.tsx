import React from 'react';
import Page from '../components/Page';
import { NetworkVisualization } from '../components/network/NetworkVisualization';

export function Network() {
  return (
    <Page title="Adventure Network">
      <div className="space-y-6">
        <div className="alert alert-info">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h3 className="font-bold">Interactive Network Visualization</h3>
              <div className="text-sm">
                • Click and drag nodes to reposition them<br/>
                • Click on a node to see its details<br/>
                • Different shapes and colors represent different entity types<br/>
                • Line thickness indicates relationship strength
              </div>
            </div>
          </div>
        </div>
        
        <NetworkVisualization />
      </div>
    </Page>
  );
}