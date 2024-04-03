import s from "../styles.module.scss";
import { ListBulletIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import {
  useGetCurrentAccount,
  useGetCurrentWallet,
} from "@/ui/states/walletState";
import { useTransactionManagerContext } from "@/ui/utils/tx-ctx";
import Loading from "react-loading";
import { shortAddress } from "@/shared/utils/transactions";
import CopyBtn from "@/ui/components/copy-btn";
import { t } from "i18next";
import cn from "classnames";
import { Popover, Transition } from "@headlessui/react";
import { Fragment, useRef } from "react";

const AccountPanel = () => {
  const currentWallet = useGetCurrentWallet();
  const currentAccount = useGetCurrentAccount();

  const { currentPrice } = useTransactionManagerContext();

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const leaveTimeOutRef = useRef<NodeJS.Timeout | null>(null);
  const enterTimeOutRef = useRef<NodeJS.Timeout | null>(null);

  const handleEnter = (isOpen: boolean) => {
    if (currentAccount.balance === undefined) return;
    clearTimeout(leaveTimeOutRef.current);
    enterTimeOutRef.current = setTimeout(() => {
      !isOpen && triggerRef.current?.click();
    }, 240);
  };

  const handleLeave = (isOpen: boolean) => {
    clearTimeout(enterTimeOutRef.current);
    leaveTimeOutRef.current = setTimeout(() => {
      isOpen && triggerRef.current?.click();
    }, 240);
  };

  return (
    <div className={s.accPanel}>
      <div className="flex gap-3 items-center">
        <div>
          <p>
            {currentAccount.id === 0 &&
            !currentWallet.hideRoot &&
            currentWallet.type === "root"
              ? "Root account"
              : currentAccount.name}
          </p>
          <CopyBtn
            title={currentAccount?.address}
            className={s.accPubAddress}
            label={shortAddress(currentAccount?.address, 9)}
            value={currentAccount?.address}
          />
        </div>
      </div>
      <Popover className="relative w-full">
        {({ open }) => (
          <>
            <div className="border border-purple-3 rounded-lg bg-dark-purple p-4 w-full flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 aspect-square rounded-full p-2 bg-light-purple-2">
                  <img
                    src="/icon.png"
                    className="w-[24px] rounded-xl"
                    alt="icon"
                  />
                </div>
                <div className="grid gap-1">
                  <p className="text-text text-base">Bells</p>
                </div>
              </div>
              <div className="grid gap-1">
                <p
                  className="text-text text-base"
                  style={{
                    textAlign: "right",
                  }}
                >
                  {currentAccount?.balance !== undefined ? (
                    currentPrice !== undefined ? (
                      <div className="text-gray-500 text-sm">
                        ~${(currentAccount.balance * currentPrice)?.toFixed(3)}
                      </div>
                    ) : undefined
                  ) : undefined}
                </p>
                <p className="text-[14px] leading-[18px] text-purple-4 text-right flex items-center">
                  {currentAccount?.balance === undefined ? (
                    <Loading
                      type="spin"
                      color="#ffbc42"
                      width={"1rem"}
                      height={"1rem"}
                      className="react-loading pr-2"
                    />
                  ) : (
                    (currentAccount?.balance ?? 0).toFixed(
                      currentAccount.balance?.toFixed(0).toString().length >= 4
                        ? 8 -
                            currentAccount.balance?.toFixed(0)?.toString()
                              .length <
                          0
                          ? 0
                          : 8 -
                            currentAccount.balance?.toFixed(0)?.toString()
                              .length
                        : 8
                    )
                  )}{" "}
                  BEL
                </p>
              </div>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-[-50%]"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-[-50%]"
            >
              <Popover.Panel
                onMouseEnter={() => handleEnter(open)}
                onMouseLeave={() => handleLeave(open)}
                className="absolute w-full flex flex-col top-full left-0 bg-opacity-90 bg-black rounded-xl p-3 text-sm"
              >
                <p>
                  {`${t("wallet_page.amount_in_transactions")}: `}
                  {`${currentAccount.balance?.toFixed(8)} BEL`}
                </p>
                <p>
                  {`${t("wallet_page.amount_in_inscriptions")}: `}
                  {`${currentAccount.inscriptionBalance?.toFixed(8)} BEL`}
                </p>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
};

export default AccountPanel;
