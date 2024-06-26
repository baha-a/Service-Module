import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Popup from "../Popup";
import { Button, Track } from "..";
import FileGenerateContent from "./FileGenerateContent";
import ConditionBuilderContent from "./ConditionBuilderContent";
import { useTranslation } from "react-i18next";
import TextfieldContent from "./TextfieldContent";
import * as Tabs from "@radix-ui/react-tabs";
import TextfieldTestContent from "./TextfieldTestContent";
import DefaultMessageContent from "./DefaultMessageContent";
import EndConversationContent from "./EndConversationContent";
import JsonRequestContent from "./JsonRequestContent";
import axios from "axios";
import { servicesRequestsExplain } from "../../resources/api-constants";
import OpenWebPageContent from "./OpenWebPageContent";
import OpenWebPageTestContent from "./OpenWebPageTestContent";
import { Node } from "reactflow";
import RasaRulesContent from "./RasaRulesContent";
import { ConditionRuleType, StepType } from "../../types";
import "./styles.scss";
import { PreDefinedEndpointEnvVariables } from "../../types/endpoint";

interface FlowElementsPopupProps {
  node: any;
  availableVariables?: PreDefinedEndpointEnvVariables;
  onClose: () => void;
  onSave: (updatedNode: Node) => void;
  onRulesUpdate: (rules: (string | null)[], rulesData: ConditionRuleType[]) => void;
  oldRules: (string | null)[];
}

const FlowElementsPopup: React.FC<FlowElementsPopupProps> = ({
  node,
  availableVariables,
  onClose,
  onSave,
  oldRules,
  onRulesUpdate,
}) => {
  const { t } = useTranslation();
  const [isYesNoQuestion, setIsYesNoQuestion] = useState(node?.isYesNoQuestion ?? false);
  const [rules, setRules] = useState<ConditionRuleType[]>(node?.data?.rules ?? []);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [isJsonRequestVisible, setIsJsonRequestVisible] = useState(false);
  const [jsonRequestContent, setJsonRequestContent] = useState<string | null>(null);

  useEffect(() => {
    if (node) node.data.rules = rules;
  }, [rules]);

  // StepType.Textfield
  const [textfieldMessage, setTextfieldMessage] = useState<string | null>(null);
  const [textfieldMessagePlaceholders, setTextfieldMessagePlaceholders] = useState<{ [key: string]: string }>({});
  // StepType.OpenWebpage
  const [webpageName, setWebpageName] = useState<string | null>(null);
  const [webpageUrl, setWebpageUrl] = useState<string | null>(null);
  // StepType.FileGenerate
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

  if (!node) return <></>;

  const stepType = node.data.stepType;
  const title = node.data.label;
  const isReadonly = node.data.readonly;

  const handleSaveClick = () => {
    if (stepType === StepType.Input) {
      const count = isYesNoQuestion ? 2 : rules.length;
      const result = [];
      for (let i = 0; i < count; i++) {
        let item = null;
        if (i < oldRules.length) item = oldRules[i];
        result.push(item);
      }
      return onRulesUpdate(result, rules);
    }
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        message: textfieldMessage ?? node.data?.message,
        link: webpageUrl ?? node.data?.link,
        linkText: webpageName ?? node.data?.linkText,
        fileName: fileName ?? node.data?.fileName,
        fileContent: fileContent ?? node.data?.fileContent,
      },
    };
    onSave(updatedNode);
  };

  const fetchExplainRequestJson = async () => {
    try {
      const response = await axios.post(servicesRequestsExplain(), {});
      setJsonRequestContent(response.data);
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  const resetStates = () => {
    setSelectedTab(null);
    setIsJsonRequestVisible(false);
    setJsonRequestContent(null);
    setTextfieldMessage(null);
    setWebpageName(null);
    setWebpageUrl(null);
    setFileName(null);
    setFileContent(null);
    setTextfieldMessagePlaceholders({});
  };

  return (
    <Popup
      style={{ maxWidth: 700 }}
      title={title}
      onClose={() => {
        resetStates();
        onClose();
      }}
      footer={
        <Track direction="horizontal" gap={16} justify="between" style={{ width: "100%" }}>
          <Button
            appearance="text"
            onClick={async () => {
              await fetchExplainRequestJson();
              setIsJsonRequestVisible(!isJsonRequestVisible);
            }}
          >
            {t(isJsonRequestVisible ? "serviceFlow.popup.hideJsonRequest" : "serviceFlow.popup.showJsonRequest")}
          </Button>
          <Track gap={16}>
            {!isReadonly && (
              <Button appearance="secondary" onClick={onClose}>
                {t("global.cancel")}
              </Button>
            )}
            <Button
              onClick={() => {
                handleSaveClick();
                resetStates();
              }}
            >
              {t(isReadonly ? "global.close" : "global.save")}
            </Button>
          </Track>
        </Track>
      }
    >
      <Track direction="vertical" align="stretch" gap={16} className="flow-body-reverse-margin">
        <Tabs.Root
          className="vertical-tabs__column"
          orientation="horizontal"
          value={selectedTab ?? t("serviceFlow.tabs.setup")!}
          onValueChange={setSelectedTab}
        >
          <Tabs.List>
            <Tabs.Trigger className="vertical-tabs__trigger" value={t("serviceFlow.tabs.setup")}>
              {t("serviceFlow.tabs.setup")}
            </Tabs.Trigger>
            {!isReadonly && (
              <Tabs.Trigger className="vertical-tabs__trigger" value={t("serviceFlow.tabs.test")}>
                {t("serviceFlow.tabs.test")}
              </Tabs.Trigger>
            )}
          </Tabs.List>

          <Tabs.Content value={t("serviceFlow.tabs.setup")} className="vertical-tabs__body">
            {stepType === StepType.Textfield && (
              <TextfieldContent
                defaultMessage={node.data.message ?? textfieldMessage ?? undefined}
                availableVariables={availableVariables}
                onChange={(message, placeholders) => {
                  setTextfieldMessage(message);
                  setTextfieldMessagePlaceholders(placeholders);
                }}
              />
            )}
            {stepType === StepType.OpenWebpage && (
              <OpenWebPageContent
                onWebpageNameChange={setWebpageName}
                onWebpageUrlChange={setWebpageUrl}
                defaultWebpageUrl={node.data.link ?? webpageUrl ?? undefined}
                defaultWebpageName={node.data.linkText ?? webpageName ?? undefined}
              />
            )}
            {(stepType === StepType.FileGenerate || stepType === StepType.Input) && (
              <DndProvider backend={HTML5Backend}>
                {stepType === StepType.Input && (
                  <ConditionBuilderContent
                    availableVariables={availableVariables}
                    isYesNoQuestion={isYesNoQuestion}
                    setIsYesNoQuestion={setIsYesNoQuestion}
                    rules={rules}
                    setRules={setRules}
                  />
                )}
                {stepType === StepType.FileGenerate && (
                  <FileGenerateContent
                    availableVariables={availableVariables}
                    onFileNameChange={setFileName}
                    onFileContentChange={setFileContent}
                    defaultFileName={node?.data?.fileName ?? fileName ?? undefined}
                    defaultFileContent={node?.data?.fileContent ?? fileContent ?? undefined}
                  />
                )}
              </DndProvider>
            )}
            {stepType === StepType.FinishingStepRedirect && (
              <DefaultMessageContent message={t("serviceFlow.popup.redirectToCustomerSupport")} />
            )}
            {stepType === StepType.Auth && <DefaultMessageContent message={t("serviceFlow.popup.loginWithTARA")} />}
            {stepType === StepType.FileSign && <DefaultMessageContent message={t("serviceFlow.popup.fileSignYesNo")} />}
            {stepType === StepType.FinishingStepEnd && <EndConversationContent />}
            {stepType === StepType.RasaRules && <RasaRulesContent />}
            <JsonRequestContent isVisible={isJsonRequestVisible} jsonContent={jsonRequestContent} />
          </Tabs.Content>
          {!isReadonly && (
            <Tabs.Content value={t("serviceFlow.tabs.test")} className="vertical-tabs__body">
              {stepType === StepType.Textfield && (
                <TextfieldTestContent
                  placeholders={textfieldMessagePlaceholders}
                  message={textfieldMessage || node.data.message}
                />
              )}
              {stepType === StepType.OpenWebpage && (
                <OpenWebPageTestContent websiteUrl={webpageUrl} websiteName={webpageName} />
              )}
            </Tabs.Content>
          )}
        </Tabs.Root>
      </Track>
    </Popup>
  );
};

export default FlowElementsPopup;
