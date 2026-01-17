'use client'

import { ReactFlowProvider } from "@xyflow/react"
import { WorkflowCanvas } from "./canvas"
import { Sidebar } from "./sidebar"

export default function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col relative overflow-hidden">
        <div className="flex-1 flex relative">
          <Sidebar />
          <div className="flex-1 overflow-hidden">
            <WorkflowCanvas />
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  )
}
