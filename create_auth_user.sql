-- CREATE USER IN SUPABASE AUTH FOR POKER-NOVO PROJECT
-- Execute este script no Supabase SQL Editor
-- https://supabase.com/dashboard/project/jhodhxvvhohygijqcxbo/sql/new

-- STEP 1: Create user in auth.users with project_id for isolation
DO $$
DECLARE
  new_user_id UUID;
  existing_user_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO existing_user_id 
  FROM auth.users 
  WHERE email = 'luisfboff@hotmail.com';

  IF existing_user_id IS NOT NULL THEN
    -- User exists, update metadata
    UPDATE auth.users
    SET raw_user_meta_data = '{"full_name":"Luis Fernando Boff","tenant_id":1,"project_id":"poker-novo"}',
        updated_at = NOW()
    WHERE id = existing_user_id;
    
    new_user_id := existing_user_id;
    RAISE NOTICE 'User already exists, updated metadata. ID: %', new_user_id;
  ELSE
    -- Generate new UUID for the user
    new_user_id := gen_random_uuid();

    -- Insert user into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'luisfboff@hotmail.com',
      '$2a$10$jnceZg5YrU3QCdWEzWWBeeWa2.ktPU7J.fc0ymdayAiysfaG7z2bi', -- bcrypt hash da senha original
      NOW(),
      NOW(),
      '',
      NOW(),
      '',
      NOW(),
      '',
      '',
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Luis Fernando Boff","tenant_id":1,"project_id":"poker-novo"}', -- PROJECT ISOLATION
      FALSE,
      NOW(),
      NOW(),
      NULL,
      NULL,
      '',
      '',
      NOW(),
      '',
      0,
      NULL,
      '',
      NOW()
    );
    
    RAISE NOTICE 'User created successfully with ID: %', new_user_id;
  END IF;

  -- Insert identity for email provider (only if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM auth.identities 
    WHERE user_id = new_user_id AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      new_user_id::text,
      new_user_id,
      format('{"sub":"%s","email":"luisfboff@hotmail.com","email_verified":true,"phone_verified":false}', new_user_id::text)::jsonb,
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  -- Update poker.users with supabase_user_id
  UPDATE poker.users
  SET supabase_user_id = new_user_id
  WHERE email = 'luisfboff@hotmail.com';

  RAISE NOTICE 'User created successfully with ID: %', new_user_id;
END $$;

-- STEP 2: Verify creation
SELECT 
  u.id AS supabase_user_id,
  u.email,
  u.raw_user_meta_data->>'project_id' AS project_id,
  u.raw_user_meta_data->>'tenant_id' AS tenant_id,
  u.created_at,
  pu.id AS poker_user_id,
  pu.name
FROM auth.users u
LEFT JOIN poker.users pu ON pu.supabase_user_id = u.id
WHERE u.email = 'luisfboff@hotmail.com';
