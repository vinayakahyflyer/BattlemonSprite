import { getServerSession } from "next-auth"

export default async function Builds(){

const session = await getServerSession()

if(!session){
return <div>Please login</div>
}

return <div>Build your BattleMon</div>

}
