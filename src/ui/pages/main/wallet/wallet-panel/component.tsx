import s from "../styles.module.scss";
import {
  Cog6ToothIcon,
  ChevronDownIcon,
  // NewspaperIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { useGetCurrentWallet } from "@/ui/states/walletState";
import cn from "classnames";
import { t } from "i18next";

const WalletPanel = () => {
  const currentWallet = useGetCurrentWallet();

  return (
    <div className="flex justify-between mt-2 items-center mb-4">
      <Link
        className="flex gap-3 items-center select-none cursor-pointer"
        to={"/pages/switch-wallet"}
      >
        <img
          src="/icon.png"
          className="rounded-xl"
          style={{
            width: "24px",
          }}
          alt="icon"
        />
        <div className="grid gap-1">
          <div className="flex gap-2 items-center">
            <div
              className={s.change}
              style={{
                color: "#998CA6",
              }}
            >
              {currentWallet?.name ?? "wallet"}{" "}
            </div>
            <ChevronDownIcon className="w-4 h-4 text-purple-4" />
          </div>
        </div>
      </Link>

      <div className="flex gap-2 items-center">
        <Link
          to={"/pages/receive"}
          className="rounded-lg p-2 flex gap-2 items-center bg-light-purple-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M3.33331 11.6666L12.6666 2.33331"
              stroke="#998CA6"
              strokeWidth="1.5"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3.33331 4.82001V11.6667H10.18"
              stroke="#998CA6"
              strokeWidth="1.5"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2.33331 14.6667H13.6666"
              stroke="#998CA6"
              strokeWidth="1.5"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[14px] leading-[18px] text-text">
            {t("wallet_page.receive")}
          </span>
        </Link>
        <Link
          to={"/pages/create-send"}
          className="rounded-lg p-2 flex gap-2 items-center bg-light-purple-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M13.6667 14.6667H2.33335"
              stroke="#998CA6"
              strokeWidth="1.5"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12.6667 2.33331L3.33335 11.6666"
              stroke="#998CA6"
              strokeWidth="1.5"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12.6667 9.17998V2.33331H5.82002"
              stroke="#998CA6"
              strokeWidth="1.5"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[14px] leading-[18px] text-text">
            {t("wallet_page.send")}
          </span>
        </Link>
      </div>

      {/* <div className="flex gap-3 items-center">
        <Link
          to={"/pages/inscriptions"}
          className="cursor-pointer flex items-center justify-center"
        >
          <img
            src="https://i.ibb.co/W3Scy9R/cyborg-nft-lettering-2-2.png"
            alt="shit"
            className={cn("w-12", s.nftImage)}
          />
        </Link>
        <div className="w-[1px] bg-white bg-opacity-25 h-5" />
        <Link to={"/pages/settings"} className="cursor-pointer">
          <Cog6ToothIcon className="w-6 h-6 hover:rotate-90 transition-transform" />
        </Link>
      </div> */}
    </div>
  );
};

export default WalletPanel;
