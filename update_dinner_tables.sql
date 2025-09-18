-- Drop existing tables first (in correct order)
DROP TABLE IF EXISTS dinner_participants;
DROP TABLE IF EXISTS dinner_data;

-- Recreate dinner_data table with correct columns
CREATE TABLE dinner_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payer VARCHAR(255),
    division_type ENUM('equal', 'custom') DEFAULT 'equal',
    custom_amount DECIMAL(10,2) DEFAULT 0.00,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Recreate dinner_participants table with correct columns
CREATE TABLE dinner_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dinner_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dinner_id) REFERENCES dinner_data(id) ON DELETE CASCADE
);
