
-- 1) Non-negative balance constraint
ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS wallets_balance_nonneg;
ALTER TABLE public.wallets ADD CONSTRAINT wallets_balance_nonneg CHECK (balance >= 0);

-- 2) Atomic debit function: conditional UPDATE returns new balance, or NULL if insufficient/missing
CREATE OR REPLACE FUNCTION public.debit_wallet_atomic(
  _wallet_id uuid,
  _user_id uuid,
  _amount numeric
)
RETURNS TABLE(balance_before numeric, balance_after numeric, currency text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before numeric;
  v_after numeric;
  v_currency text;
BEGIN
  IF _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  UPDATE public.wallets
     SET balance = balance - _amount
   WHERE id = _wallet_id
     AND user_id = _user_id
     AND status = 'active'
     AND balance >= _amount
   RETURNING (balance + _amount), balance, currency
        INTO v_before, v_after, v_currency;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient funds or wallet unavailable';
  END IF;

  RETURN QUERY SELECT v_before, v_after, v_currency;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.debit_wallet_atomic(uuid, uuid, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.debit_wallet_atomic(uuid, uuid, numeric) TO service_role;
