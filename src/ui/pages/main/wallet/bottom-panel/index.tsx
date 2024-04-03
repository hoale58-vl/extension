import { Link } from "react-router-dom";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";

const BottomPanel = () => {
  return (
    <div className="sticky bottom-0 bg-[#120C18] py-3 flex justify-end">
      <Link to={"/pages/settings"} className="cursor-pointer">
        <Cog6ToothIcon className="w-6 h-6 hover:rotate-90 transition-transform" />
      </Link>
    </div>
  );
};

export default BottomPanel;
