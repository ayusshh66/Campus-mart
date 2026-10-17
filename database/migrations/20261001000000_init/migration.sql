-- CampusMart PostgreSQL Initial Migration
-- CreateTable
CREATE TABLE "colleges" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "buy_price" DOUBLE PRECISION NOT NULL,
    "sell_price" DOUBLE PRECISION NOT NULL,
    "is_buying_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sell_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "description" TEXT,
    "images" TEXT NOT NULL DEFAULT '[]',
    "admin_buy_price" DOUBLE PRECISION,
    "admin_sell_price" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sell_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buy_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buy_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_hero_applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "instagram" TEXT,
    "linkedin" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campus_hero_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "colleges_code_key" ON "colleges"("code");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sell_requests" ADD CONSTRAINT "sell_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sell_requests" ADD CONSTRAINT "sell_requests_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sell_requests" ADD CONSTRAINT "sell_requests_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buy_requests" ADD CONSTRAINT "buy_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "buy_requests" ADD CONSTRAINT "buy_requests_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "buy_requests" ADD CONSTRAINT "buy_requests_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_hero_applications" ADD CONSTRAINT "campus_hero_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campus_hero_applications" ADD CONSTRAINT "campus_hero_applications_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
