import type { Model } from "survey-core";
import { FlatLightPanelless } from "survey-core/themes";

/**
 * ธีม SurveyJS แบบ panelless (ไม่มีกล่อง/การ์ดรอบคำถาม)
 * ปรับสีให้เข้ากับ warm editorial ของ TONLABKIT
 */
export const TU_SURVEY_THEME = {
  ...FlatLightPanelless,
  cssVariables: {
    ...FlatLightPanelless.cssVariables,
    "--sjs-font-family": "var(--font-mitr), sans-serif",
    "--sjs-font-head-family": "var(--font-mitr), sans-serif",
    "--sjs-font-questiontitle-family": "var(--font-mitr), sans-serif",
    "--sjs-font-editorfont-family": "var(--font-mitr), sans-serif",
    "--sjs-primary-backcolor": "#C8102E",
    "--sjs-primary-backcolor-dark": "#A60D26",
    "--sjs-primary-backcolor-light": "rgba(200,16,46,0.1)",
    "--sjs-general-backcolor": "transparent",
    "--sjs-general-backcolor-dark": "transparent",
    "--sjs-general-backcolor-dim": "transparent",
    "--sjs-general-backcolor-dim-light": "transparent",
    "--sjs-general-backcolor-dim-dark": "transparent",
    "--sjs-editorpanel-backcolor": "transparent",
    "--sjs-editor-background": "transparent",
    "--sjs-questionpanel-backcolor": "transparent",
    "--sjs-question-background": "transparent",
    "--sjs-shadow-small": "none",
    "--sjs-shadow-medium": "none",
    "--sjs-shadow-large": "none",
    "--sjs-shadow-inner": "none",
    "--sjs-border-light": "#F0E8DC",
    "--sjs-border-default": "#E8DED0",
    "--sjs-special-red": "#C8102E",
    "--sjs-font-questiontitle-color": "#2A2320",
    "--sjs-font-editorfont-size": "14px",
    "--sjs-corner-radius": "12px",
  },
};

export function applyTuSurveyTheme(model: Model) {
  model.applyTheme(TU_SURVEY_THEME);
}
