import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  CheckCircle,
  AlertCircle,
  Copy,
  Code2,
  RefreshCw,
  Cpu,
  Layers,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';

export const McpInspectorPage: React.FC = () => {
  const [tools, setTools] = useState<any[]>([]);
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [argumentsJson, setArgumentsJson] = useState('{}');
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const res = await api.getMcpTools();
      setTools(res.tools || []);
      if (res.tools && res.tools.length > 0) {
        selectTool(res.tools[0]);
      }
    } catch (err: any) {
      console.warn('Failed to load MCP tools:', err);
    }
  };

  const selectTool = (tool: any) => {
    setSelectedTool(tool);
    // Generate clean template args from tool parameters
    const defaultArgs: Record<string, any> = {};
    if (tool.parameters?.properties) {
      Object.entries(tool.parameters.properties).forEach(([key, spec]: [string, any]) => {
        if (spec.type === 'string') defaultArgs[key] = spec.enum ? spec.enum[0] : '';
        else if (spec.type === 'number') defaultArgs[key] = 10;
        else if (spec.type === 'boolean') defaultArgs[key] = true;
      });
    }
    setArgumentsJson(JSON.stringify(defaultArgs, null, 2));
    setExecutionResult(null);
  };

  const handleInvoke = async () => {
    if (!selectedTool) return;
    setIsLoading(true);
    setExecutionResult(null);

    let parsedArgs = {};
    try {
      parsedArgs = JSON.parse(argumentsJson);
    } catch (e: any) {
      alert(`Invalid JSON in arguments: ${e.message}`);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.invokeMcpTool(selectedTool.name, parsedArgs);
      setExecutionResult(res);
    } catch (err: any) {
      setExecutionResult({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const copyJson = (data: any) => {
    navigator.clipboard.writeText(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span>Model Context Protocol (MCP) Inspector</span>
          </h2>
          <p className="text-xs text-slate-400">
            Official MCP Server protocol specification compliant testbench (Protocol Version 2024-11-05)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-mono">
            MCP Server: Active (Streamable HTTP / JSON-RPC 2.0)
          </span>
        </div>
      </div>

      {/* Main Grid: Tools list on left, Test Runner on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Registered MCP Tools */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#0d1322] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Registered Tools ({tools.length})
            </span>
            <button
              onClick={loadTools}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {tools.map(tool => {
              const isSelected = selectedTool?.name === tool.name;
              return (
                <div
                  key={tool.name}
                  onClick={() => selectTool(tool)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/50 border-cyan-700 text-cyan-300 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-semibold">{tool.name}()</span>
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {tool.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Execution Playground and JSON-RPC Inspector */}
        <div className="lg:col-span-8 space-y-4">
          {selectedTool ? (
            <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 space-y-4">
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <span>{selectedTool.name}</span>
                    <span className="text-xs font-normal text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-md border border-cyan-800">
                      tool
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {selectedTool.description}
                  </p>
                </div>

                <button
                  onClick={handleInvoke}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-cyan-950 shrink-0 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isLoading ? 'Invoking MCP...' : 'Execute Tool'}</span>
                </button>
              </div>

              {/* Arguments JSON Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Input Parameters (JSON Schema)
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">application/json</span>
                </div>
                <textarea
                  rows={5}
                  value={argumentsJson}
                  onChange={(e) => setArgumentsJson(e.target.value)}
                  className="w-full font-mono text-xs p-3.5 rounded-xl bg-black/60 border border-slate-800 text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* JSON-RPC 2.0 Response Result */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <span>MCP JSON-RPC 2.0 Response</span>
                    {executionResult && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        (200 OK)
                      </span>
                    )}
                  </label>

                  {executionResult && (
                    <button
                      onClick={() => copyJson(executionResult)}
                      className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copied ? 'Copied' : 'Copy Response'}</span>
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-black/80 border border-slate-800 font-mono text-xs text-slate-200 min-h-[160px] max-h-[300px] overflow-y-auto">
                  {executionResult ? (
                    <pre className="text-emerald-300 leading-relaxed">
                      {JSON.stringify(executionResult, null, 2)}
                    </pre>
                  ) : (
                    <div className="h-28 flex items-center justify-center text-slate-600 text-xs">
                      Click "Execute Tool" to invoke this MCP endpoint and inspect the live JSON-RPC envelope.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center rounded-2xl bg-[#0d1322] border border-slate-800">
              <Terminal className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Select an MCP tool from the left to inspect its schema and execute.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
