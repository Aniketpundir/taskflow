import { useDispatch, useSelector } from "react-redux";

// Thin wrappers kept in one place so components import hooks consistently
// and it's easy to add typed versions later if the project migrates to TS.
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
