import { useCallback, useEffect, useState } from "react";

import { KeyIcon } from "@heroicons/react/24/solid";
import Layout from "../layout";
import Loading from "react-loading";
import { IField } from "@/shared/interfaces/provider";
import { useDecodePsbtInputs as useGetPsbtFields } from "@/ui/hooks/provider";
import { PREVIEW_URL } from "@/shared/constant";
import { t } from "i18next";
import cn from "classnames";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import Modal from "@/ui/components/modal";

const SignPsbt = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [fields, setFields] = useState<IField[]>([]);
  const [modalInputIndex, setModalInputIndex] = useState<number | undefined>(
    undefined
  );
  const getPsbtFields = useGetPsbtFields();

  const updateFields = useCallback(async () => {
    if (fields.length <= 0) setLoading(true);
    try {
      const resultFields = await getPsbtFields();
      if (resultFields === undefined) return;
      setFields(resultFields);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }, [getPsbtFields, fields]);

  useEffect(() => {
    if (fields.length) return;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateFields();
  }, [updateFields, fields]);

  if (loading) return <Loading type="balls" />;

  return (
    <Layout
      documentTitle={t("provider.sign_tx")}
      resolveBtnClassName="text-text bg-primary hover:bg-[#A30F4D]"
      resolveBtnText={t("provider.sign")}
    >
      <div className="flex flex-col overflow-y-scroll max-h-[420px] standard:max-h-full standard:overflow-hidden items-center gap-3 p-3 text-sm">
        <div className="flex items-center justify-center gap-3 mb-3">
          <KeyIcon className="w-8 h-8 text-primary" />
          <h4 className="text-xl font-medium">{t("provider.sign_tx")}</h4>
        </div>
        <div className="flex flex-col gap-4 w-full">
          {fields.map((f, i) => (
            <div key={i}>
              <label className="mb-2 flex text-gray-300 pl-2 justify-between">
                <span>
                  {f.label}{" "}
                  {f.important && f.input ? (
                    <span className="text-light-orange border-2 rounded-lg border-light-orange p-1 ml-2">
                      To sign
                    </span>
                  ) : undefined}
                </span>
                {f.value.anyonecanpay && f.important && (
                  <span>
                    <ExclamationTriangleIcon
                      className="w-6 h-6 text-light-orange cursor-pointer"
                      onClick={() => {
                        setModalInputIndex(i);
                      }}
                    />
                  </span>
                )}
              </label>
              <div
                className={cn(
                  "rounded-xl px-5 py-2 break-all w-full flex justify-center border-2 bg-input-bg",
                  {
                    // "border-lime-800": !f.input && f.important,
                    // "border-light-orange": f.input && f.important,
                    "border-input-bg": true,
                  }
                )}
              >
                {f.value.inscriptions !== undefined ? (
                  <div className="flex justify-center rounded-xl w-33 h-33 overflow-hidden">
                    {f.value.inscriptions.map((k, j) => (
                      <div
                        key={j}
                        className="flex flex-col items-center justify-center p-2"
                      >
                        <img
                          src={`${PREVIEW_URL}/${k.inscription_id}`}
                          className="object-cover w-full rounded-xl"
                        />
                        <p className="text-xs">
                          {t("inscription_details.value") + ": "}
                          {f.value.value}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <p>
                      {f.input
                        ? "Utxo txid: "
                        : t("provider.to_address") + ": "}
                      {f.value.text}
                    </p>
                    <p>
                      {t("inscription_details.value") + ": "}
                      {f.value.value}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Modal
        open={modalInputIndex !== undefined}
        onClose={() => {
          setModalInputIndex(undefined);
        }}
        title={t("provider.warning")}
      >
        <div className="text-lg font-medium p-6">
          {t("provider.anyone_can_pay_warning")}
        </div>
      </Modal>
    </Layout>
  );
};

export default SignPsbt;
