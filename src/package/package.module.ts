import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserDetails } from "./entities/user.entity";
import { PackageController } from "./package.controller";
import { PackageService } from "./package.service";
import { FeeDetails } from "./entities/fee.entities";
import { SuccessMessage } from "./entities/success-message.entities";
import { Category } from "./entities/categories.entity";
import { Packages } from "./entities/packages.entity";
import { IntendedLearners } from "./entities/intended-learners.entities";
import { CourseLandingPage } from "./entities/course-landing-page.entities";
import { CartItem } from "./entities/cart_items.entity";
import { WishList } from "./entities/wish-list.entites";
import { PurchasedPackage } from "./entities/purchased-packages.entity";

@Module({
    imports: [TypeOrmModule.forFeature([UserDetails,FeeDetails,
        SuccessMessage,Category,Packages,IntendedLearners,CourseLandingPage,CartItem,WishList,PurchasedPackage])],
    controllers: [PackageController],
    providers: [PackageService],
})

export class PackageModule{

}