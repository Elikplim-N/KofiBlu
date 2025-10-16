export type ControlType = "button" | "slider" | "textInput" | "switch";

export interface ControlComponent {
  id: string;
  type: ControlType;
  label: string;
  [key: string]: any; // Allow for additional properties like 'command'
}

export interface ControlProfile {
  name: string;
  controls: ControlComponent[];
}
