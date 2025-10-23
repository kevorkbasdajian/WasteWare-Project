-- ===============================
-- SCHEMA: Waste Management System
-- ===============================

-- ===============================
-- 1. Core Entities
-- ===============================

CREATE TABLE Addresses (
    address_id SERIAL PRIMARY KEY,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    region TEXT,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    postal_code VARCHAR(20)
);

CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone_number VARCHAR(20),
    address_id INT UNIQUE REFERENCES Addresses(address_id) ON DELETE CASCADE,
    profile_image TEXT,
    points_balance INT DEFAULT 0,
    account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active','suspended','deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Companies (
    company_id SERIAL PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone_number VARCHAR(20),
    address_id INT UNIQUE REFERENCES Addresses(address_id) ON DELETE CASCADE,
    license_number VARCHAR(50),
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL -- (Client, Company, Admin)
);

CREATE TABLE Admins (
    admin_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id INT REFERENCES Roles(role_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    company_id INT REFERENCES Companies(company_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type VARCHAR(50) CHECK (type IN ('alert','reward','report','system')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- 2. Operations
-- ===============================

CREATE TABLE Waste_Types (
    waste_type_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE Reports (
    report_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type_of_report VARCHAR(50) CHECK (type_of_report IN ('illegal dumping','public littering','hazardous materials','construction debris','organic waste','E-waste')),
    severity_level INT,
    response_priority VARCHAR(20) CHECK (response_priority IN ('routine','moderate','high','emergency')),
    location_latitude DECIMAL(9,6),
    location_longitude DECIMAL(9,6),
    description TEXT,
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved')),
    handled_by INT REFERENCES Admins(admin_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE Schedules (
    schedule_id SERIAL PRIMARY KEY,
    company_id INT REFERENCES Companies(company_id) ON DELETE CASCADE,
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    waste_type_id INT REFERENCES Waste_Types(waste_type_id),
    pickup_date DATE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','canceled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Pickups (
    pickup_id SERIAL PRIMARY KEY,
    schedule_id INT REFERENCES Schedules(schedule_id) ON DELETE CASCADE,
    pickup_time TIMESTAMP WITH TIME ZONE,
    weight_collected DECIMAL(10,2),
    confirmation_photo TEXT,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed','missed','failed'))
);

-- ===============================
-- 3. Engagement
-- ===============================

CREATE TABLE Points (
    points_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    source VARCHAR(50) CHECK (source IN ('report','schedule_completion','reward_redemption')),
    points_earned INT DEFAULT 0,
    points_spent INT DEFAULT 0,
    balance_after INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Rewards (
    reward_id SERIAL PRIMARY KEY,
    reward_name VARCHAR(100) NOT NULL,
    description TEXT,
    points_required INT NOT NULL,
    image_url TEXT,
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available','out_of_stock'))
);

CREATE TABLE Redemptions (
    redemption_id SERIAL PRIMARY KEY,
    reward_id INT REFERENCES Rewards(reward_id),
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    points_spent INT,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','delivered'))
);

-- ===============================
-- 4. Marketplace
-- ===============================

CREATE TABLE Products (
    product_id SERIAL PRIMARY KEY,
    company_id INT REFERENCES Companies(company_id) ON DELETE CASCADE,
    product_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    quantity_available INT DEFAULT 0,
    category VARCHAR(50),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Orders (
    order_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    product_id INT REFERENCES Products(product_id),
    quantity INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending','confirmed','shipped','delivered','canceled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Transactions (
    transaction_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES Orders(order_id) ON DELETE CASCADE,
    payment_method VARCHAR(20) CHECK (payment_method IN ('credit','points','cash')),
    amount DECIMAL(10,2) NOT NULL,
    transaction_status VARCHAR(20) DEFAULT 'success' CHECK (transaction_status IN ('success','failed','refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- 5. Chatbot
-- ===============================

CREATE TABLE Chatbot_Logs (
    chat_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    message_text TEXT,
    response_text TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE FAQ (
    faq_id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50)
);

-- ===============================
-- 6. System
-- ===============================

CREATE TABLE Permissions (
    permission_id SERIAL PRIMARY KEY,
    role_id INT REFERENCES Roles(role_id),
    module_name VARCHAR(50),
    can_view BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE
);

CREATE TABLE Activity_Log (
    log_id SERIAL PRIMARY KEY,
    admin_id INT REFERENCES Admins(admin_id) ON DELETE CASCADE,
    action TEXT,
    target_table VARCHAR(50),
    target_id INT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

-- ===============================
-- Indexes
-- ===============================
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_companies_email ON Companies(email);
CREATE INDEX idx_addresses_city ON Addresses(city);
CREATE INDEX idx_schedules_user_id ON Schedules(user_id);
CREATE INDEX idx_orders_user_id ON Orders(user_id);
CREATE INDEX idx_reports_user_id ON Reports(user_id);
